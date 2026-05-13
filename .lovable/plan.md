## Sinal Verde — CRM Financeiro (MVP visual)

Construirei um sistema web completo, navegável, 100% frontend com dados mock, no padrão SaaS premium (HubSpot/Pipedrive/Linear). Sem backend nesta fase — auth, banco e WhatsApp ficam como UI realista pronta para integração futura.

### Identidade visual
- Paleta: `#2b5330` (primary), `#76b43c` (accent/CTA), `#fcffde` (background), neutros derivados em `oklch`.
- Tipografia: **Sora** (títulos, hierarquia forte) + **Manrope** (corpo). Carregadas via `<link>` em `__root.tsx`.
- Tokens semânticos em `src/styles.css` (primary, accent, surface, muted, success, warning, danger, info, sidebar-*) com modo claro e dark opcional.
- Cantos `rounded-xl/2xl`, sombras suaves multicamada, bordas 1px sutis, micro-animações com `tailwindcss-animate`.
- Logo "Sinal Verde" em SVG inline (folha + sinal de check) — sem dependências externas.

### Arquitetura de rotas (TanStack Start, file-based)
```
src/routes/
  __root.tsx                 -> shell global (fontes, head, QueryClient)
  login.tsx                  -> tela pública premium
  _app.tsx                   -> layout autenticado (sidebar + topbar + Outlet)
  _app/index.tsx             -> Dashboard
  _app/clientes.tsx          -> CRM (Kanban + Tabela, toggle)
  _app/clientes.$id.tsx      -> Ficha do cliente (timeline + dados)
  _app/clientes.novo.tsx     -> Cadastro em 5 abas
  _app/propostas.tsx         -> Lista de propostas + status
  _app/remarketing.tsx       -> Operacional de remarketing
  _app/agenda.tsx            -> Calendário + follow-ups
  _app/documentos.tsx        -> Upload drag-and-drop
  _app/relatorios.tsx        -> Gráficos e rankings
  _app/whatsapp.tsx          -> Central estilo Kommo
  _app/configuracoes.tsx     -> Tabs: usuários, bancos, produtos, tags, status, integrações
```
Login não usa o layout `_app`. O layout `_app` aplica auth-guard mock (sempre liberado) e contém sidebar fixa colapsável, topbar com busca global, breadcrumbs e avatar.

### Componentes-chave
- **Sidebar** (shadcn/ui sidebar) colapsável com ícones lucide, agrupamentos (Operação, Comercial, Configurações), item ativo destacado.
- **Topbar**: breadcrumb dinâmico, busca global (⌘K mock), notificações, atendente logado.
- **StatusBadge** com 11 status pedidos, cada um com cor/token próprio.
- **KanbanBoard** com colunas por status, cards arrastáveis (dnd-kit), contadores e totais.
- **DataTable** premium (TanStack Table) com filtros, ordenação, paginação, seleção, tags coloridas.
- **ClientWizard** com 5 abas (Dados, Endereço, Financeiro, Produto, Uploads) + validação `react-hook-form + zod`.
- **Dropzone** (react-dropzone) para documentos com preview, categorias, histórico.
- **Charts** (recharts): área, barras, donut, ranking horizontal.
- **CalendarView** + lista do dia + timeline lateral.
- **WhatsAppInbox**: lista de conversas, painel central de mensagens, painel de contato/etiquetas à direita.
- **CommandPalette**, **Skeletons**, **EmptyStates**, **Modais sofisticados**, **Toasts** (sonner).

### Telas — entregáveis
1. **Login** — split-screen, lado esquerdo branding com gradiente verde, direito form (email, senha, lembrar, recuperar). Botão "Entrar" leva ao Dashboard.
2. **Dashboard** — 8 KPI cards, 4 gráficos, tabela de últimos leads/movimentações, painel lateral (agenda, follow-ups, prioritários).
3. **CRM Clientes** — toggle Kanban/Tabela, filtros avançados, tags, busca rápida, drawer de detalhe.
4. **Cadastro Cliente** — wizard 5 abas com stepper, validação, salvar rascunho (mock).
5. **Propostas** — tabela + filtros por banco/status/produto, drawer com detalhes.
6. **Remarketing** — lista priorizada, timeline de contatos, botão WhatsApp, agendamento, disparo em massa (mock).
7. **Agenda** — calendário mensal + lista do dia + timeline + filtros (follow-up, retorno, pós-venda).
8. **Documentos** — dropzone, grid por categoria, preview modal, histórico.
9. **Relatórios** — cards, gráficos, rankings de atendentes/bancos/produtos, conversão e ROI.
10. **WhatsApp** — layout 3 colunas estilo Kommo com conversas mock e templates.
11. **Configurações** — tabs para usuários/permissões, bancos, produtos, tags, status, integrações.

### Dados mock
- `src/mocks/` com clientes, propostas, atendentes, bancos, produtos, conversas, eventos de agenda. Seed determinístico para demos consistentes.

### Detalhes técnicos
- Stack: TanStack Start + React 19 + Tailwind v4 + shadcn/ui já instalados.
- Adicionar libs: `@tanstack/react-table`, `@dnd-kit/core`, `@dnd-kit/sortable`, `react-hook-form`, `zod`, `react-dropzone`, `date-fns`, `recharts` (já presente), `sonner` (já presente).
- Tokens em `src/styles.css` com `oklch`; nada de cores hardcoded em componentes.
- Responsividade: sidebar vira drawer no mobile; tabelas com scroll horizontal; Kanban com swipe.
- Dark mode opcional via toggle no topbar (classe `dark`).
- Acessibilidade: foco visível, contraste AA, navegação teclado.

### Fora de escopo nesta fase
- Backend real (Lovable Cloud), autenticação real, persistência, uploads reais, integração WhatsApp/Twilio, envio de e-mails, permissões reais.
- Esses pontos ficam preparados na UI para plug-in posterior.

### Ordem de execução
1. Tokens + tipografia + layout `_app` + sidebar + topbar + login.
2. Dashboard + componentes base (KPI, charts, tabelas).
3. CRM Clientes (Kanban + Tabela) + ficha + cadastro wizard.
4. Propostas, Remarketing, Agenda.
5. Documentos, Relatórios, WhatsApp, Configurações.
6. Polimento: animações, empty states, responsivo, dark mode.

Resultado: app naveg​ável ponta-a-ponta com aparência premium, pronto para validar UX com a equipe comercial e evoluir para backend depois.