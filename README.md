# Financas — Controle Financeiro Pessoal

App mobile-first de controle financeiro pessoal, estilo "planilha de saldo diário": lançamentos categorizados (entrada, saída, diário, economia, cartão), saldo acumulado dia a dia, totais mensais e tags customizáveis.

## Stack

- **React 19 + TypeScript** — Vite como bundler
- **Tailwind CSS v4** — tema claro/escuro, config via `@theme` em `src/index.css` (sem `tailwind.config.js`/PostCSS — usa o plugin `@tailwindcss/vite`)
- **React Router** — navegação entre telas
- **Zustand** — estado global com persistência localStorage
- **Framer Motion** — animações (sidebar, bottom sheet do modal)
- **lucide-react** — ícones
- **Supabase JS** — cliente para sync opcional com backend
- **Persistência**: `localStorage` (offline-first) com sync assíncrono para Supabase (opcional)

## Estrutura

```
src/
  components/
    Layout.tsx             # shell com sidebar + bottom nav mobile; pin/unpin sidebar
    AddModal.tsx           # fluxo de adicionar lançamento; select dropdown para recorrência
    EditTransactionModal.tsx # edição de lançamentos existentes
    AddTagModal.tsx        # criação de tags com color picker
    EditTagModal.tsx       # edição de tags com color picker
    ui/sidebar.tsx         # sidebar colapsável (hover-expand no desktop); respeta fixed state
  pages/
    Saldos.tsx            # home — tabela de dias x categorias + saldo (heatmap)
    Totais.tsx            # cards de performance/economizado/custo de vida/diário médio
    Tags.tsx              # CRUD de tags com dropdown menu (editar/deletar); color picker
    Horizonte.tsx         # projeção de 6 meses de saldo com color-coded status
    Menu.tsx              # configurações: tema (claro/escuro/sistema), export JSON, delete com confirmação
  store/index.ts          # Zustand store (transactions, tags) + persistência localStorage; sync Supabase
  lib/supabase.ts         # cliente Supabase com CRUD functions; graceful fallback
  types/index.ts          # Transaction, Tag, tipos e constantes de categoria
  utils.ts                # formatação de moeda/data, cálculo de saldo diário e totais mensais
  lib/utils.ts            # helper `cn` (clsx + tailwind-merge)
  index.css               # Tailwind v4 com @theme; temas claro/escuro com media queries
```

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173 (ou próxima porta livre)
npm run build     # type-check + build de produção
npm run lint       # oxlint
```

## Modelo de dados

```ts
Transaction {
  id, type: 'entrada'|'saida'|'diario'|'economia'|'cartao',
  amount, description, date,
  recurrence: 'none'|'daily'|'weekly'|'monthly'|'fixed_until',
  recurrence_end_date?, tag_ids[], created_at
}

Tag { id, name, color }
```

## Regras de negócio

- **Saldo do dia** = saldo anterior + entradas − saídas − diários − economias (cartão **não** entra no saldo diário — é fatura em aberto, separada)
- **Performance do mês** = Σentradas − Σsaídas − Σdiários − Σeconomias − Σcartão
- **% economizado** = Σeconomias / Σentradas × 100
- **Custo de vida** = Σsaídas + Σdiários + Σcartão
- **Diário médio** = Σdiários / dias decorridos no mês

---

## Implementações recentes (v1.0)

### UI/UX
- [x] **Recorrência como select dropdown** — Substituição dos botões por select nativo (mais compacto; opções: Nenhuma, Diário, Semanal, Mensal, Até uma data)
- [x] **Tag editing** — Modal para editar nome e cor das tags com color picker (preset + custom color)
- [x] **Fixed sidebar toggle** — Botão pin/unpin para fixar a sidebar (persistido em localStorage)
- [x] **Tema claro/escuro** — Radio buttons no Menu para selecionar Light/Dark/System; aplicado antes do render (sem flash)

### Páginas
- [x] **Menu (Settings)** — Tema, Export de dados (JSON), Delete com confirmação de 2 passos, Info do app
- [x] **Horizonte** — Projeção de 6 meses com balance por mês, performance, categoria breakdown (entrada/saída/diário/economia/cartão); color-coded (red/yellow/green)

### Backend
- [x] **Supabase integration** — Cliente configurado com CRUD functions (insert, update, delete); localStorage fallback se desabilitado
- [x] **Theme persistence** — Leitura de tema no mount (main.tsx) antes do render; CSS support com @media queries e [data-theme] attributes

---

## Banco de dados: Supabase (planejado)

A persistência hoje é só `localStorage` (por navegador, sem sync). O plano é migrar para **Supabase** (Postgres + Auth + Row Level Security), permitindo sync multi-dispositivo.

### O que isso implica
- Tabelas `transactions` e `tags` com `user_id` (FK para `auth.users`)
- **RLS obrigatório** em ambas as tabelas (`user_id = auth.uid()`) — sem isso, qualquer usuário autenticado lê/escreve dados de qualquer outro
- Autenticação via Supabase Auth (email/senha ou magic link)
- Client `@supabase/supabase-js` substituindo o `store/index.ts` atual (ou mantendo Zustand como cache local + Supabase como fonte de verdade)
- Migração de dados existentes do `localStorage` para a conta do usuário no primeiro login

Ver detalhes de risco em `SECURITY.md`.

---

## Pendências de desenvolvimento

### Funcionalidades do escopo original ainda não implementadas
- [ ] **Edição/exclusão de lançamentos** — células da tabela de saldos ainda não são clicáveis para abrir o lançamento
- [x] **Recorrência de lançamentos** — UI select dropdown com tipos: Nenhuma, Diário, Semanal, Mensal, Até uma data; projeção automática para "horizonte"
- [ ] **Seleção de tags no lançamento** — modal de adicionar não tem campo de tags ainda
- [x] **Tela "horizonte"** — projeção de saldo futuro para os próximos 6 meses baseada em recorrências; mostra performance e categoria breakdown
- [x] **Tela "menu"** — configurações com tema (claro/escuro/sistema), export de dados, delete com confirmação, info do app
- [ ] **Múltiplos meses lado a lado** na tela de saldos (desktop) — hoje mostra só um mês por vez
- [x] **Edição/exclusão de tags** — modal de edição para nome e cor (com color picker), dropdown menu em cada tag
- [ ] **Reordenar tags** (botão shuffle mencionado no escopo) — não implementado
- [ ] **Date picker customizado** (dd/mm/aa) — hoje usa `<input type="date">` nativo do navegador

### Infraestrutura / técnico
- [ ] **Migração para Supabase** (auth + Postgres + RLS) — ver seção acima
- [ ] **Testes automatizados** — não há nenhum teste no projeto ainda
- [ ] **Validação de inputs** — formulário de lançamento não valida valor máximo, datas inválidas, etc.
- [ ] **Acessibilidade** — falta auditoria de contraste, `aria-label`s em botões só-ícone, navegação por teclado no modal
- [ ] **PWA / instalável** — sem manifest.json nem service worker para uso offline real
- [ ] **Tratamento de erros de storage** — `localStorage` cheio ou bloqueado (modo privado) falha silenciosamente (só `console.error`)

Ver `SECURITY.md` para o levantamento de gargalos de performance e riscos de segurança.
