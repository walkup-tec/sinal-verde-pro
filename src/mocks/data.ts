// Centralized mock data for Sinal Verde CRM (deterministic).

export type StatusKey =
  | "novo"
  | "atendimento"
  | "documentos"
  | "pre_aprovado"
  | "analise"
  | "aprovado"
  | "reprovado"
  | "inadimplente"
  | "pos_venda"
  | "remarketing"
  | "recorrente";

export const STATUS_META: Record<
  StatusKey,
  { label: string; tone: "info" | "warning" | "success" | "danger" | "muted" | "primary" | "accent" }
> = {
  novo: { label: "Novo Lead", tone: "info" },
  atendimento: { label: "Em atendimento", tone: "primary" },
  documentos: { label: "Aguard. documentos", tone: "warning" },
  pre_aprovado: { label: "Pré-aprovado", tone: "accent" },
  analise: { label: "Em análise", tone: "info" },
  aprovado: { label: "Aprovado", tone: "success" },
  reprovado: { label: "Reprovado", tone: "danger" },
  inadimplente: { label: "Inadimplente", tone: "danger" },
  pos_venda: { label: "Pós-venda", tone: "primary" },
  remarketing: { label: "Remarketing", tone: "warning" },
  recorrente: { label: "Cliente recorrente", tone: "success" },
};

export const STATUS_ORDER: StatusKey[] = [
  "novo",
  "atendimento",
  "documentos",
  "pre_aprovado",
  "analise",
  "aprovado",
  "reprovado",
  "remarketing",
  "pos_venda",
];

export const PRODUTOS = [
  "Crédito Consignado",
  "FGTS Antecipação",
  "Cartão Consignado",
  "Refinanciamento",
  "Empréstimo Pessoal",
  "Portabilidade",
];

export const BANCOS = [
  "Banco Pan",
  "Bradesco",
  "Itaú Consignado",
  "BMG",
  "Daycoval",
  "Olé",
  "C6 Consig",
  "Santander",
];

export const ATENDENTES = [
  { id: "a1", nome: "Carla Mendes", avatar: "CM" },
  { id: "a2", nome: "Rafael Souza", avatar: "RS" },
  { id: "a3", nome: "Beatriz Lima", avatar: "BL" },
  { id: "a4", nome: "Diego Castro", avatar: "DC" },
  { id: "a5", nome: "Mariana Alves", avatar: "MA" },
];

export const ORIGENS = ["Facebook Ads", "Google Ads", "Indicação", "WhatsApp", "Site", "Orgânico"];

export type Cliente = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: string;
  uf: string;
  produto: string;
  banco: string;
  valor: number;
  parcelas: number;
  status: StatusKey;
  score: number;
  atendenteId: string;
  origem: string;
  tags: string[];
  criadoEm: string; // ISO
  ultimoContato: string;
};

const NOMES = [
  "Ana Beatriz Costa", "João Pedro Almeida", "Fernanda Ribeiro", "Lucas Oliveira",
  "Patrícia Santos", "Marcos Vieira", "Juliana Pereira", "Rodrigo Barros",
  "Camila Nogueira", "Eduardo Tavares", "Vanessa Moreira", "Felipe Cardoso",
  "Larissa Duarte", "Thiago Martins", "Renata Lopes", "Gustavo Andrade",
  "Bianca Silveira", "André Figueiredo", "Tatiane Rocha", "Henrique Pacheco",
  "Sabrina Teixeira", "Bruno Magalhães", "Letícia Carvalho", "Ricardo Monteiro",
];

const CIDADES: [string, string][] = [
  ["São Paulo", "SP"], ["Rio de Janeiro", "RJ"], ["Belo Horizonte", "MG"],
  ["Curitiba", "PR"], ["Porto Alegre", "RS"], ["Salvador", "BA"],
  ["Recife", "PE"], ["Fortaleza", "CE"], ["Brasília", "DF"], ["Goiânia", "GO"],
];

function seedRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function genCpf(r: () => number): string {
  const n = () => Math.floor(r() * 10);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

function genTel(r: () => number): string {
  const n = () => Math.floor(r() * 10);
  return `(${n()}${n()}) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`;
}

const r = seedRand(42);
const STATUSES = Object.keys(STATUS_META) as StatusKey[];

export const CLIENTES: Cliente[] = Array.from({ length: 48 }).map((_, i) => {
  const nome = NOMES[i % NOMES.length] + (i >= NOMES.length ? ` ${Math.floor(i / NOMES.length) + 1}` : "");
  const [cidade, uf] = pick(CIDADES, r);
  const status = pick(STATUSES, r);
  const valor = Math.floor(2000 + r() * 48000);
  const score = Math.floor(300 + r() * 600);
  const daysAgo = Math.floor(r() * 60);
  const date = new Date(Date.now() - daysAgo * 86400000);
  const lastContact = new Date(Date.now() - Math.floor(r() * 14) * 86400000);
  const tagPool = ["VIP", "Aposentado", "Servidor", "INSS", "Privado", "Quente", "Frio", "Indicado"];
  const tags = Array.from({ length: 1 + Math.floor(r() * 2) }).map(() => pick(tagPool, r));
  return {
    id: `cli_${(i + 1).toString().padStart(3, "0")}`,
    nome,
    cpf: genCpf(r),
    telefone: genTel(r),
    email: nome.toLowerCase().replace(/[^a-z]/g, ".") + "@email.com",
    cidade,
    uf,
    produto: pick(PRODUTOS, r),
    banco: pick(BANCOS, r),
    valor,
    parcelas: pick([24, 36, 48, 60, 72, 84, 96], r),
    status,
    score,
    atendenteId: pick(ATENDENTES, r).id,
    origem: pick(ORIGENS, r),
    tags: Array.from(new Set(tags)),
    criadoEm: date.toISOString(),
    ultimoContato: lastContact.toISOString(),
  };
});

export type Proposta = {
  id: string;
  clienteId: string;
  banco: string;
  produto: string;
  valor: number;
  status: StatusKey;
  data: string;
};

export const PROPOSTAS: Proposta[] = CLIENTES.slice(0, 32).map((c, i) => ({
  id: `prop_${(i + 1).toString().padStart(4, "0")}`,
  clienteId: c.id,
  banco: c.banco,
  produto: c.produto,
  valor: c.valor,
  status: c.status,
  data: c.criadoEm,
}));

export type AgendaItem = {
  id: string;
  clienteId: string;
  tipo: "follow_up" | "retorno" | "pos_venda" | "reuniao";
  titulo: string;
  data: string; // ISO
  concluido: boolean;
};

export const AGENDA: AgendaItem[] = CLIENTES.slice(0, 18).map((c, i) => {
  const daysOffset = (i % 7) - 2;
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(9 + (i % 8), (i * 13) % 60, 0, 0);
  const tipos: AgendaItem["tipo"][] = ["follow_up", "retorno", "pos_venda", "reuniao"];
  return {
    id: `ag_${i + 1}`,
    clienteId: c.id,
    tipo: tipos[i % tipos.length],
    titulo:
      i % 4 === 0
        ? `Follow-up: ${c.produto}`
        : i % 4 === 1
        ? `Retorno proposta ${c.banco}`
        : i % 4 === 2
        ? `Pós-venda — confirmar liberação`
        : `Reunião ${c.nome.split(" ")[0]}`,
    data: d.toISOString(),
    concluido: i % 5 === 0,
  };
});

// Conversas WhatsApp mock
export type Conversa = {
  id: string;
  clienteId: string;
  ultimaMensagem: string;
  hora: string;
  naoLidas: number;
  etiquetas: string[];
};

export const CONVERSAS: Conversa[] = CLIENTES.slice(0, 14).map((c, i) => ({
  id: `conv_${i + 1}`,
  clienteId: c.id,
  ultimaMensagem: [
    "Pode me enviar a proposta?",
    "Beleza, vou separar os documentos",
    "Quanto fica a parcela?",
    "Obrigado pelo atendimento!",
    "Já caiu na conta, valeu!",
    "Posso retornar amanhã?",
  ][i % 6],
  hora: `${8 + (i % 11)}:${((i * 7) % 60).toString().padStart(2, "0")}`,
  naoLidas: i % 3 === 0 ? 1 + (i % 3) : 0,
  etiquetas: i % 2 === 0 ? ["Quente"] : ["Aguardando"],
}));

export const ETIQUETAS = ["Quente", "Frio", "Aguardando", "VIP", "Inadimplente", "Indicado"];

export function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function atendenteNome(id: string): string {
  return ATENDENTES.find((a) => a.id === id)?.nome ?? "—";
}

export function clientePorId(id: string): Cliente | undefined {
  return CLIENTES.find((c) => c.id === id);
}
