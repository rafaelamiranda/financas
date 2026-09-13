# Financas — Controle Financeiro Pessoal

App mobile-first de controle financeiro pessoal, estilo "planilha de saldo diário": lançamentos categorizados (entrada, saída, diário, economia, cartão), saldo acumulado dia a dia, totais mensais e tags customizáveis.

## Stack

- **React 19 + TypeScript** — Vite como bundler
- **Tailwind CSS v4** — tema claro/escuro, config via `@theme` em `src/index.css` (sem `tailwind.config.js`/PostCSS — usa o plugin `@tailwindcss/vite`)
- **React Router** — navegação entre telas
- **Zustand** — estado global com persistência localStorage
- **Framer Motion** — animações (sidebar, bottom sheet do modal)
- **lucide-react** — ícones
- **Supabase Auth + Postgres** — autenticação obrigatória e backend de transações/tags
- **Persistência**: `localStorage` (cache offline-first) com sync assíncrono para Supabase (obrigatório após auth)

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

## Implementações recentes (v1.1)

### UI/UX
- [x] **Recorrência com contagem limite** — Escolha entre infinito ou número específico de ocorrências (select + input numérico condicionado)
- [x] **Sidebar comportamento corrigido** — Removeu abertura automática no hover; adicionou botão explícito (chevron) para abrir; botão X para fechar
- [x] **Tabela de saldos padronizada** — Meses com 30 e 31 dias agora têm altura visual consistente (padding rows + fixed height `h-12`)
- [x] **Ícone de menu alterado** — Substituição de hamburger por engrenagem (Settings icon) na rota `/settings`
- [x] **Nome do projeto** — Alterado de "financas" para "Finanças" (com acento) na sidebar
- [x] **Botão adicionar circular** — Perfeito círculo (`w-10 h-10 rounded-full`) quando sidebar está recolhida
- [x] **Recorrência como select dropdown** — Substituição dos botões por select nativo (mais compacto; opções: Nenhuma, Diário, Semanal, Mensal, Até uma data)
- [x] **Tag editing** — Modal para editar nome e cor das tags com color picker (preset + custom color)
- [x] **Tema claro/escuro** — Radio buttons no Menu para selecionar Light/Dark/System; aplicado antes do render (sem flash)

### Páginas
- [x] **Menu (Settings)** — Tema, Export de dados (JSON), Delete com confirmação de 2 passos, Info do app
- [x] **Horizonte** — Projeção de 6 meses com balance por mês, performance, categoria breakdown (entrada/saída/diário/economia/cartão); color-coded (red/yellow/green)

### Backend
- [x] **Supabase integration** — Cliente configurado com CRUD functions (insert, update, delete); localStorage fallback se desabilitado
- [x] **Theme persistence** — Leitura de tema no mount (main.tsx) antes do render; CSS support com @media queries e [data-theme] attributes

---

## Autenticação: Supabase Auth (Implementado — Fase D)

**Autenticação é OBRIGATÓRIA** — o app não funciona sem login via Supabase.

### Implementado em Fase D:
- ✅ **Supabase Auth** — sign up/sign in via email + senha
- ✅ **RLS (Row Level Security)** em `transactions` e `tags` — cada usuário só vê seus dados (`user_id = auth.uid()`)
- ✅ **Pull-on-load** — transações e tags são puxadas do Supabase ao fazer login
- ✅ **Migração de dados** — dados do localStorage são migrados para a conta do usuário no primeiro login (opcional)
- ✅ **Logout** — botão "Sair" em Configurações limpa a sessão e retorna ao login
- ✅ **AuthGate** — todas as rotas protegidas; sem auth, só tela de login é visível

### Fluxo de autenticação:
1. Usuário faz sign up ou login via `src/pages/Login.tsx`
2. Supabase valida credenciais e retorna session
3. `useAuthStore` (Zustand) armazena session em memória
4. App puxaa transações/tags do Supabase via RLS (apenas seus dados)
5. Dados são cacheados em `localStorage` para modo offline
6. Qualquer mudança é sincronizada com Supabase (com retry se offline)

Ver detalhes de segurança em `SECURITY.md` e `SUPABASE_SETUP.md`.

---

## Status de Desenvolvimento

### ✅ Funcionalidades Implementadas
**Escopo original (100% completo):**
- ✅ Edição/exclusão de lançamentos
- ✅ Recorrência de lançamentos (com contagem limite)
- ✅ Seleção de tags no lançamento
- ✅ Tela "horizonte" (projeção 6 meses)
- ✅ Tela "menu" (configurações)
- ✅ Edição/exclusão de tags (com color picker)
- ✅ Múltiplos meses lado a lado (desktop: 1/2/3 conforme viewport)
- ✅ Reordenar tags (drag-and-drop + shuffle button)
- ✅ Date picker customizado (dd/mm/aa + calendário)

**Infraestrutura (100% completo):**
- ✅ Autenticação obrigatória (Supabase Auth + RLS)
- ✅ Testes automatizados (21 unit tests, Vitest)
- ✅ Validação de inputs (range, dates, recurrence_count)
- ✅ Acessibilidade (aria-labels, focus rings, WCAG)
- ✅ PWA / instalável (Manifest + service worker)
- ✅ Tratamento de erros de storage (Toast notifications)
- ✅ Análise de segurança (SECURITY_ANALYSIS.md)

Ver `SECURITY.md` para o levantamento de gargalos de performance e riscos de segurança.
