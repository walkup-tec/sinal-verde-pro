import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cloneDefaultFieldGroups } from "@/lib/config/client-fields";
import { DEFAULT_SYSTEM_SETTINGS, mergeAttendanceStatusCatalog, normalizeSettings } from "@/lib/config/settings-defaults";
import { extractStatusLabelFromNote } from "@/lib/clients/client-status";
import type {
  AttendanceStatusConfig,
  BankConfig,
  OperationConfig,
  ProductConfig,
  SystemSettings,
  UserCategory,
} from "@/lib/config/settings-types";
import type { MenuItemId } from "@/lib/config/menu-items";
import type { ClientFieldGroup } from "@/lib/config/client-fields";
import type postgres from "postgres";
import { getSql, isDatabaseEnabled } from "@/lib/db/postgres";

const DATA_DIR = join(process.cwd(), "data");
const SETTINGS_FILE = join(DATA_DIR, "system-settings.json");

export type SettingsSaveSection =
  | "categories"
  | "products"
  | "banks"
  | "operations"
  | "attendanceStatuses"
  | "all";

let cachedSettings: SystemSettings | null = null;

type Tx = postgres.TransactionSql<Record<string, never>>;

async function ensureFieldCatalogTable(sql: Awaited<ReturnType<typeof getSql>>): Promise<void> {
  await sql`
    create table if not exists crm.client_field_catalog (
      id text primary key,
      groups_json jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
}

async function loadSystemSettingsFromPostgres(): Promise<SystemSettings> {
  const sql = await getSql();
  await sql`
    alter table crm.attendance_statuses
    add column if not exists color text not null default '#64748b'
  `;
  await sql`
    alter table crm.attendance_statuses
    add column if not exists auto_return_days int null
  `;

  await sql`
    alter table crm.user_categories
    add column if not exists home_menu_id text not null default 'dashboard'
  `;
  await sql`
    alter table crm.attendance_statuses
    add column if not exists kind text not null default 'atendimento'
  `;
  await ensureFieldCatalogTable(sql);
  await sql`
    create table if not exists crm.operations (
      id text primary key,
      name text not null,
      updated_at timestamptz not null default now()
    )
  `;
  await ensureAttendanceStatusArchiveColumn(sql);
  await recoverOrphanAttendanceStatuses(sql);

  const [
    categories,
    menus,
    products,
    productFields,
    banks,
    operations,
    attendanceStatuses,
    fieldCatalog,
  ] = await Promise.all([
    sql<{ id: string; name: string; home_menu_id: string | null }[]>`
      select id, name, home_menu_id from crm.user_categories order by name
    `,
    sql<{ category_id: string; menu_id: string }[]>`
      select category_id, menu_id from crm.user_category_menus
    `,
    sql<{ id: string; name: string }[]>`
      select id, name from crm.products order by name
    `,
    sql<{ product_id: string; field_id: string; required: boolean }[]>`
      select product_id, field_id, required from crm.product_fields
    `,
    sql<{ id: string; name: string }[]>`
      select id, name from crm.banks order by name
    `,
    sql<{ id: string; name: string }[]>`
      select id, name from crm.operations order by name
    `,
    sql<
      {
        id: string;
        label: string;
        color: string | null;
        auto_return_days: number | null;
        kind: string | null;
        sort_order: number;
        archived_at: Date | null;
      }[]
    >`
      select id, label, color, auto_return_days, kind, sort_order, archived_at
      from crm.attendance_statuses
      order by archived_at nulls first, sort_order, label
    `,
    sql<{ groups_json: ClientFieldGroup[] }[]>`
      select groups_json from crm.client_field_catalog where id = 'default' limit 1
    `,
  ]);

  const menuMap = new Map<string, MenuItemId[]>();
  for (const row of menus) {
    const list = menuMap.get(row.category_id) ?? [];
    list.push(row.menu_id as MenuItemId);
    menuMap.set(row.category_id, list);
  }

  const fieldsByProduct = new Map<string, { required: string[]; optional: string[] }>();
  for (const row of productFields) {
    const entry = fieldsByProduct.get(row.product_id) ?? { required: [], optional: [] };
    if (row.required) entry.required.push(row.field_id);
    else entry.optional.push(row.field_id);
    fieldsByProduct.set(row.product_id, entry);
  }

  return normalizeSettings({
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      menuIds: menuMap.get(category.id) ?? [],
      homeMenuId: (category.home_menu_id as MenuItemId | null) ?? "dashboard",
    })),
    products: products.map((product) => {
      const fields = fieldsByProduct.get(product.id) ?? { required: [], optional: [] };
      return {
        id: product.id,
        name: product.name,
        requiredFieldIds: fields.required,
        availableFieldIds: fields.optional,
      };
    }),
    banks: banks.map((bank) => ({ id: bank.id, name: bank.name })),
    operations: operations.map((operation) => ({ id: operation.id, name: operation.name })),
    attendanceStatuses: attendanceStatuses.map((status) => ({
      id: status.id,
      label: status.label,
      color: status.color ?? "#64748b",
      autoReturnDays: status.auto_return_days,
      kind: status.kind === "contrato" ? "contrato" : "atendimento",
      archived: Boolean(status.archived_at),
    })),
    fieldGroups: Array.isArray(fieldCatalog[0]?.groups_json)
      ? fieldCatalog[0].groups_json
      : cloneDefaultFieldGroups(),
  } as SystemSettings);
}

async function syncFieldCatalog(tx: Tx, fieldGroups: ClientFieldGroup[]): Promise<void> {
  await tx`
    insert into crm.client_field_catalog (id, groups_json, updated_at)
    values ('default', ${tx.json(fieldGroups)}, now())
    on conflict (id) do update set
      groups_json = excluded.groups_json,
      updated_at = now()
  `;
}

async function syncCategories(tx: Tx, categories: UserCategory[]): Promise<void> {
  if (categories.length === 0) {
    await tx`delete from crm.user_category_menus`;
    await tx`delete from crm.user_categories`;
    return;
  }

  const payload = categories.map((category) => ({
    id: category.id,
    name: category.name,
    menu_ids: category.menuIds,
    home_menu_id: category.homeMenuId,
  }));

  await tx`
    with input as (
      select *
      from jsonb_to_recordset(${tx.json(payload)}) as x(
        id text,
        name text,
        menu_ids jsonb,
        home_menu_id text
      )
    ),
    del_menu_orphans as (
      delete from crm.user_category_menus m
      where not exists (select 1 from input i where i.id = m.category_id)
      returning 1
    ),
    del_cats as (
      delete from crm.user_categories c
      where not exists (select 1 from input i where i.id = c.id)
      returning 1
    ),
    upsert_cats as (
      insert into crm.user_categories (id, name, home_menu_id, updated_at)
      select id, name, coalesce(nullif(home_menu_id, ''), 'dashboard'), now() from input
      on conflict (id) do update
        set name = excluded.name,
            home_menu_id = excluded.home_menu_id,
            updated_at = now()
      returning id
    ),
    del_menus as (
      delete from crm.user_category_menus m
      using input i
      where m.category_id = i.id
      returning 1
    )
    select 1
  `;

  await tx`
    insert into crm.user_category_menus (category_id, menu_id)
    select i.id, menu_id
    from jsonb_to_recordset(${tx.json(payload)}) as i(
      id text,
      name text,
      menu_ids jsonb,
      home_menu_id text
    )
    cross join lateral jsonb_array_elements_text(coalesce(i.menu_ids, '[]'::jsonb)) as menu_id
    on conflict (category_id, menu_id) do nothing
  `;
}

async function syncProducts(tx: Tx, products: ProductConfig[]): Promise<void> {
  if (products.length === 0) {
    await tx`delete from crm.product_fields`;
    await tx`delete from crm.products`;
    return;
  }

  const payload = products.map((product) => ({
    id: product.id,
    name: product.name,
    required_field_ids: product.requiredFieldIds,
  }));

  await tx`
    with input as (
      select *
      from jsonb_to_recordset(${tx.json(payload)}) as x(id text, name text, required_field_ids jsonb)
    ),
    del_field_orphans as (
      delete from crm.product_fields f
      where not exists (select 1 from input i where i.id = f.product_id)
      returning 1
    ),
    del_products as (
      delete from crm.products p
      where not exists (select 1 from input i where i.id = p.id)
      returning 1
    ),
    upsert_products as (
      insert into crm.products (id, name, updated_at)
      select id, name, now() from input
      on conflict (id) do update set name = excluded.name, updated_at = now()
      returning id
    ),
    del_fields as (
      delete from crm.product_fields f
      using input i
      where f.product_id = i.id
      returning 1
    )
    select 1
  `;

  await tx`
    insert into crm.product_fields (product_id, field_id, required)
    select i.id, field_id, true
    from jsonb_to_recordset(${tx.json(payload)}) as i(id text, name text, required_field_ids jsonb)
    cross join lateral jsonb_array_elements_text(coalesce(i.required_field_ids, '[]'::jsonb)) as field_id
    on conflict (product_id, field_id) do update set required = excluded.required
  `;
}

async function syncBanks(tx: Tx, banks: BankConfig[]): Promise<void> {
  if (banks.length === 0) {
    await tx`delete from crm.banks`;
    return;
  }

  const payload = banks.map((bank) => ({ id: bank.id, name: bank.name }));

  await tx`
    with input as (
      select * from jsonb_to_recordset(${tx.json(payload)}) as x(id text, name text)
    ),
    del_banks as (
      delete from crm.banks b
      where not exists (select 1 from input i where i.id = b.id)
      returning 1
    ),
    upsert_banks as (
      insert into crm.banks (id, name, updated_at)
      select id, name, now() from input
      on conflict (id) do update set name = excluded.name, updated_at = now()
      returning id
    )
    select 1
  `;
}

async function syncOperations(tx: Tx, operations: OperationConfig[]): Promise<void> {
  if (operations.length === 0) {
    await tx`delete from crm.operations`;
    return;
  }

  const payload = operations.map((operation) => ({ id: operation.id, name: operation.name }));

  await tx`
    with input as (
      select * from jsonb_to_recordset(${tx.json(payload)}) as x(id text, name text)
    ),
    del_operations as (
      delete from crm.operations o
      where not exists (select 1 from input i where i.id = o.id)
      returning 1
    ),
    upsert_operations as (
      insert into crm.operations (id, name, updated_at)
      select id, name, now() from input
      on conflict (id) do update set name = excluded.name, updated_at = now()
      returning id
    )
    select 1
  `;
}

async function ensureAttendanceStatusArchiveColumn(sql: Awaited<ReturnType<typeof getSql>>): Promise<void> {
  await sql`
    alter table crm.attendance_statuses
    add column if not exists archived_at timestamptz null
  `;
}

async function recoverOrphanAttendanceStatuses(sql: Awaited<ReturnType<typeof getSql>>): Promise<void> {
  await sql`
    alter table crm.clients
    add column if not exists status_label text not null default ''
  `;
  await sql`
    alter table crm.clients
    add column if not exists contract_status_label text not null default ''
  `;

  const existing = await sql<{ id: string }[]>`select id from crm.attendance_statuses`;
  const existingIds = new Set(existing.map((row) => row.id));
  const used = await sql<{ id: string }[]>`
    select distinct status as id from crm.clients
    where coalesce(nullif(trim(status), ''), '') <> ''
    union
    select distinct contract_status as id from crm.clients
    where coalesce(nullif(trim(contract_status), ''), '') <> ''
  `;
  const missing = used.map((row) => row.id).filter((id) => id && !existingIds.has(id));

  if (missing.length > 0) {
    const notes = await sql<{ status: string; note: string }[]>`
      select distinct on (c.status) c.status, a.note
      from crm.clients c
      inner join crm.client_attendances a on a.client_id = c.id
      where c.status = any(${missing})
        and (
          a.note ilike '%alterado para:%'
          or a.note ilike '%definido como:%'
          or a.note ilike '%em lote para:%'
        )
      order by c.status, a.created_at desc
    `;
    const labelById = new Map(
      notes.map((row) => [row.status, extractStatusLabelFromNote(row.note)] as const),
    );

    for (const id of missing) {
      const label = labelById.get(id)?.trim() || id;
      await sql`
        insert into crm.attendance_statuses (
          id, label, color, auto_return_days, kind, sort_order, archived_at, updated_at
        )
        values (
          ${id},
          ${label},
          ${"#64748b"},
          ${null},
          ${"atendimento"},
          ${1000},
          now(),
          now()
        )
        on conflict (id) do nothing
      `;
    }
  }

  await sql`
    update crm.clients c
    set status_label = s.label
    from crm.attendance_statuses s
    where c.status = s.id
      and coalesce(c.status_label, '') = ''
      and coalesce(s.label, '') <> ''
      and s.label <> s.id
  `;
  await sql`
    update crm.clients c
    set contract_status_label = s.label
    from crm.attendance_statuses s
    where c.contract_status = s.id
      and coalesce(c.contract_status_label, '') = ''
      and coalesce(s.label, '') <> ''
      and s.label <> s.id
  `;
}

async function syncAttendanceStatuses(tx: Tx, statuses: AttendanceStatusConfig[]): Promise<void> {
  const payload = statuses.map((status, index) => ({
    id: status.id,
    label: status.label,
    color: status.color,
    auto_return_days: status.autoReturnDays,
    kind: status.kind,
    sort_order: index + 1,
    archived: Boolean(status.archived),
  }));

  if (payload.length === 0) {
    await tx`
      update crm.attendance_statuses
      set archived_at = coalesce(archived_at, now()), updated_at = now()
      where archived_at is null
    `;
    return;
  }

  const ids = payload.map((status) => status.id);

  await tx`
    insert into crm.attendance_statuses (id, label, color, auto_return_days, kind, sort_order, archived_at, updated_at)
    select id, label, color, auto_return_days, kind, sort_order,
      case when archived then now() else null end,
      now()
    from jsonb_to_recordset(${tx.json(payload)}) as x(
      id text, label text, color text, auto_return_days int, kind text, sort_order int, archived boolean
    )
    on conflict (id) do update set
      label = excluded.label,
      color = excluded.color,
      auto_return_days = excluded.auto_return_days,
      kind = excluded.kind,
      sort_order = excluded.sort_order,
      archived_at = excluded.archived_at,
      updated_at = now()
  `;

  await tx`
    update crm.attendance_statuses
    set archived_at = coalesce(archived_at, now()), updated_at = now()
    where archived_at is null
      and not (id = any(${ids}))
  `;

  await tx`
    alter table crm.clients
    add column if not exists status_label text not null default ''
  `;
  await tx`
    update crm.clients c
    set status_label = s.label
    from crm.attendance_statuses s
    where c.status = s.id
      and s.archived_at is not null
      and coalesce(c.status_label, '') = ''
      and coalesce(s.label, '') <> ''
  `;
}

function mergeSettingsForSection(
  base: SystemSettings,
  incoming: SystemSettings,
  section: SettingsSaveSection,
): SystemSettings {
  return normalizeSettings({
    categories: section === "all" || section === "categories" ? incoming.categories : base.categories,
    products: section === "all" || section === "products" ? incoming.products : base.products,
    banks: section === "all" || section === "banks" ? incoming.banks : base.banks,
    operations: section === "all" || section === "operations" ? incoming.operations : base.operations,
    attendanceStatuses:
      section === "all" || section === "attendanceStatuses"
        ? mergeAttendanceStatusCatalog(base.attendanceStatuses, incoming.attendanceStatuses)
        : base.attendanceStatuses,
    fieldGroups:
      section === "all" || section === "products" ? incoming.fieldGroups : base.fieldGroups,
  });
}

async function saveSystemSettingsToPostgres(
  settings: SystemSettings,
  section: SettingsSaveSection = "all",
): Promise<SystemSettings> {
  const incoming = normalizeSettings(settings);
  const base = await loadSystemSettingsFromPostgres();
  const next = mergeSettingsForSection(base, incoming, section);
  const sql = await getSql();
  await ensureFieldCatalogTable(sql);
  await sql`
    alter table crm.attendance_statuses
    add column if not exists kind text not null default 'atendimento'
  `;
  await ensureAttendanceStatusArchiveColumn(sql);
  await sql`
    create table if not exists crm.operations (
      id text primary key,
      name text not null,
      updated_at timestamptz not null default now()
    )
  `;

  await sql.begin(async (tx) => {
    if (section === "all" || section === "categories") {
      await syncCategories(tx, next.categories);
    }
    if (section === "all" || section === "products") {
      await syncProducts(tx, next.products);
      await syncFieldCatalog(tx, next.fieldGroups);
    }
    if (section === "all" || section === "banks") {
      await syncBanks(tx, next.banks);
    }
    if (section === "all" || section === "operations") {
      await syncOperations(tx, next.operations);
    }
    if (section === "all" || section === "attendanceStatuses") {
      await syncAttendanceStatuses(tx, next.attendanceStatuses);
    }
  });

  // Recarrega do Postgres para garantir que o que a UI vê é o que foi gravado.
  cachedSettings = null;
  cachedSettings = await loadSystemSettingsFromPostgres();
  return cachedSettings;
}

export async function loadSystemSettingsFromDisk(): Promise<SystemSettings> {
  if (isDatabaseEnabled()) {
    if (!cachedSettings) {
      cachedSettings = await loadSystemSettingsFromPostgres();
    }
    // Reaplica normalize para migrações de menu (ex.: kanban após clientes).
    cachedSettings = normalizeSettings(cachedSettings);
    return cachedSettings;
  }

  if (!cachedSettings) {
    try {
      const raw = await readFile(SETTINGS_FILE, "utf8");
      cachedSettings = normalizeSettings({
        ...DEFAULT_SYSTEM_SETTINGS,
        ...JSON.parse(raw),
      } as SystemSettings);
    } catch {
      cachedSettings = normalizeSettings(DEFAULT_SYSTEM_SETTINGS);
    }
  }

  cachedSettings = normalizeSettings(cachedSettings);
  return cachedSettings;
}

export async function saveSystemSettingsToDisk(
  settings: SystemSettings,
  section: SettingsSaveSection = "all",
): Promise<SystemSettings> {
  if (isDatabaseEnabled()) {
    return saveSystemSettingsToPostgres(settings, section);
  }

  const base = cachedSettings ?? (await loadSystemSettingsFromDisk());
  const normalized = mergeSettingsForSection(base, normalizeSettings(settings), section);
  cachedSettings = normalized;
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export function getMenuIdsForCategory(settings: SystemSettings, categoryId: string): MenuItemId[] {
  const category = settings.categories.find((item) => item.id === categoryId);
  return category?.menuIds ?? [];
}

export function getHomeMenuIdForCategory(
  settings: SystemSettings,
  categoryId: string,
): MenuItemId {
  const category = settings.categories.find((item) => item.id === categoryId);
  if (!category) return "dashboard";
  return category.homeMenuId;
}

export function invalidateSettingsCache(): void {
  cachedSettings = null;
}
