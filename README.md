# Financas — Controle Financeiro Pessoal

App mobile-first de controle financeiro pessoal, estilo "planilha de saldo diário": lançamentos categorizados (entrada, saída, diário, economia, cartão), saldo acumulado dia a dia, totais mensais e tags customizáveis.

## Stack

- **React 19 + TypeScript** — Vite como bundler
- **Tailwind CSS v4** — tema escuro nativo, config via `@theme` em `src/index.css` (sem `tailwind.config.js`/PostCSS — usa o plugin `@tailwindcss/vite`)
- **React Router** — navegação entre telas
- **Zustand** — estado global
- **Framer Motion** — animações (sidebar, bottom sheet do modal)
- **lucide-react** — ícones
- **Persistência atual**: `localStorage` (offline-first, ver seção Supabase abaixo para o plano de migração)

## Estrutura

```
src/
  components/
    Layout.tsx        # shell com sidebar + bottom nav mobile
    AddModal.tsx       # fluxo de adicionar lançamento (bottom sheet)
    ui/sidebar.tsx      # sidebar colapsável (hover-expand no desktop)
  pages/
    Saldos.tsx          # home — tabela de dias x categorias + saldo (heatmap)
    Totais.tsx          # cards de performance/economizado/custo de vida/diário médio
    Tags.tsx            # CRUD de tags com cor customizável
    Horizonte.tsx        # stub — projeção de saldo futuro
    Menu.tsx             # stub — configurações
  store/index.ts        # Zustand store (transactions, tags) + persistência localStorage
  types/index.ts         # Transaction, Tag, tipos e constantes de categoria
  utils.ts                # formatação de moeda/data, cálculo de saldo diário e totais mensais
  lib/utils.ts             # helper `cn` (clsx + tailwind-merge)
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
- [ ] **Recorrência de lançamentos** — campo existe no modelo de dados, mas não há UI nem projeção automática nos dias futuros
- [ ] **Seleção de tags no lançamento** — modal de adicionar não tem campo de tags ainda
- [ ] **Tela "horizonte"** — projeção de saldo futuro baseada em recorrências/médias (hoje é só um stub)
- [ ] **Tela "menu"** — configurações (hoje é só um stub)
- [ ] **Múltiplos meses lado a lado** na tela de saldos (desktop) — hoje mostra só um mês por vez
- [ ] **Edição/exclusão de tags** — botão de menu (⋮) existe mas só deleta, sem editar nome/cor
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
