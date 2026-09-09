# Levantamento de Gargalos e Segurança

Revisão do código atual (React + Vite + Zustand + localStorage, sem backend ainda). Achados ordenados por severidade dentro de cada seção, com arquivo/linha quando aplicável.

## Resumo executivo

| Severidade | Achado | Status |
|---|---|---|
| 🔴 Crítico | API key do 21st.dev exposta em texto puro em `.mcp.json` (rastreado pelo Git) | **Corrigido nesta revisão** — recomendo rotacionar a chave |
| 🟠 Alto | Bug de fuso horário: datas ficam 1 dia atrasadas para usuários no Brasil (UTC-3) | Pendente |
| 🟡 Médio | Dados financeiros em texto puro no `localStorage`, sem criptografia | **Mitigado com Supabase integration** — sync opcional com fallback offline; avaliar RLS antes de produção |
| 🟡 Médio | Sem validação de limites em valores de lançamento | Pendente |
| 🟢 Baixo | Cálculos de saldo/totais não memoizados (recalculam a cada render) | Pendente — só vira problema com histórico grande |
| 🟢 Baixo | `localStorage.setItem` síncrono a cada mutação, sem debounce | Pendente |

---

## Segurança

### 🔴 [Corrigido] Secret exposto em arquivo versionado
`.mcp.json` continha a API key do 21st.dev em texto puro (`x-api-key: 21st_sk_...`), rastreada pelo Git nesta pasta. Se um `git push` fosse feito, a chave ficaria no histórico do repositório remoto permanentemente (mesmo removendo depois, precisaria reescrever o histórico).

**Ação tomada**: revertido para `"x-api-key": "${API_KEY_21ST}"`, que resolve a partir da variável de ambiente do usuário (já configurada).

**Ação recomendada**: como a chave já circulou em texto puro (arquivo + esta conversa), considere gerá-la novamente em 21st.dev e revogar a antiga.

### 🟠 Bug de fuso horário nas datas
Em `src/store/index.ts:25` e em qualquer lugar que faça `new Date(dateString)` a partir de uma string `"YYYY-MM-DD"` (ex.: `src/components/AddModal.tsx`, campo de data do formulário):

```ts
date: new Date(t.date) // "2026-09-09" → interpretado como 2026-09-09T00:00:00 UTC
```

O construtor `Date` trata strings no formato `YYYY-MM-DD` como **UTC**, mas o app lê o dia com `.getDate()`/`.getMonth()`/`.getFullYear()`, que usam o **fuso local**. Para o Brasil (UTC-3), meia-noite UTC do dia 9 vira 21h do dia 8 no horário local — o lançamento aparece um dia antes do que o usuário digitou.

**Onde isso afeta**: `calculateDailyBalances` e `calculateMonthlyTotals` (`src/utils.ts`), a comparação de "dia atual" em `Saldos.tsx`, e o total por tag em `Tags.tsx`.

**Correção recomendada**: parsear a data manualmente como local (`new Date(year, month - 1, day)`) em vez de `new Date(isoString)`, tanto ao salvar quanto ao carregar do `localStorage`.

### 🟡 Dados sensíveis em texto puro no `localStorage`
Valores, descrições ("salário", "aluguel" etc.) e datas ficam sem criptografia, acessíveis a qualquer script rodando na mesma origem (ex.: uma extensão de navegador maliciosa, ou uma futura vulnerabilidade de XSS). Para um app single-device sem rede, o risco é baixo hoje. **Importante reavaliar ao integrar Supabase** — nesse ponto, dados sensíveis devem trafegar só via API autenticada, não replicados em `localStorage` sem necessidade.

### 🟡 Sem validação de entrada
O campo de valor só aceita dígitos via teclado numérico customizado (não há `<input type="text">` livre para valor), o que já evita a maioria de entradas inválidas. Mas não há:
- Limite máximo de valor (permite lançar R$ 999.999.999,00 sem aviso)
- Validação de data (permite lançamentos em datas muito distantes no passado/futuro sem confirmação)

Risco baixo (app pessoal, sem impacto em terceiros), mas vale adicionar validação básica por robustez.

### 🟢 Sem cabeçalhos de segurança / CSP
Não há `Content-Security-Policy` nem outros headers configurados — irrelevante em dev, mas precisa ser configurado no servidor/CDN quando o app for para produção.

### 🟢 [Implementado] Integração Supabase com localStorage fallback
Cliente Supabase configurado em `src/lib/supabase.ts` com CRUD functions (insert, update, delete) para transactions e tags. Todas as operações:
1. **Primário**: update local + `localStorage` (offline-first)
2. **Secundário**: async fire-and-forget sync para Supabase se `isSupabaseEnabled`

Implementado em `src/store/index.ts` — cada método de mutação (addTransaction, deleteTag, updateTag, etc.) faz o sync async com tratamento de erro graceful (fallback para localStorage).

**Status**: Implementado em v1.0. Variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) em `.env.example` — usuário configura em `.env.local` conforme `SUPABASE_SETUP.md`.

**Próximos passos antes de produção**: validar RLS policies, rate limiting, e certificar-se de que a migração de dados do localStorage ocorre após autenticação (ver checklist abaixo).

### 🟢 [Implementado] Sistema de temas (Light/Dark/System)
Tema claro/escuro com persistência em localStorage. Implementação:
- **CSS**: Tailwind v4 com `@media (prefers-color-scheme: light)` e `[data-theme="light"]/[data-theme="dark"]` selectors em `src/index.css`
- **Inicialização**: `applySavedTheme()` em `src/main.tsx` roda **antes** do React render (sem flash de tema errado)
- **Menu**: `src/pages/Menu.tsx` radio buttons para Light/Dark/System com icons e seleção visual
- **Persistência**: localStorage.setItem('theme', ...) com graceful error handling

**Status**: Implementado em v1.0. Sem vulnerabilidades conhecidas — tema é preferência do usuário, não dados sensíveis.

---

## Gargalos de performance

### Cálculo de saldos não memoizado
`Saldos.tsx` chama `calculateDailyBalances(transactions, currentDate)` diretamente no corpo do componente, sem `useMemo`. Essa função (`src/utils.ts`) itera **todos os dias do mês × todas as transações** (filter aninhado) a cada render — inclusive em renders não relacionados a dados (ex.: hover na sidebar, que já causa re-render por causa do Framer Motion no layout compartilhado).

Mesma situação em `calculateMonthlyTotals` (`Totais.tsx`) e em `getTagTotal` (`Tags.tsx`, chamado uma vez por tag dentro de `.map()` — O(tags × transações) por render).

**Impacto real hoje**: nenhum perceptível (poucas transações). **Vira gargalo** conforme o histórico cresce (anos de lançamentos diários = milhares de registros).

**Correção recomendada**: envolver essas chamadas em `useMemo` com `[transactions, currentDate]` como dependências.

### Persistência síncrona sem debounce
Toda mutação no store (`addTransaction`, `updateTransaction`, `deleteTag` etc., em `src/store/index.ts`) serializa o array **inteiro** de transações + tags com `JSON.stringify` e grava no `localStorage` de forma síncrona, bloqueando a thread principal brevemente. Não há debounce/batching — se no futuro houver import em massa ou edição rápida sucessiva, cada operação individual paga o custo total de serialização.

**Impacto real hoje**: imperceptível. **Correção recomendada**: se a base de dados crescer muito, debounce de ~300ms no `saveToStorage` ou migração para IndexedDB (assíncrono, não bloqueia).

### Seletores do store retornam novo array a cada chamada
`getTransactionsByMonth`/`getTransactionsByType` (`src/store/index.ts`) fazem `filter()` e retornam um array novo a cada invocação — ainda não usados em nenhum componente hoje, mas se forem chamados diretamente dentro de um `useFinancasStore(s => s.getTransactionsByMonth(date))`, cada render dispara um novo cálculo (função, não é um selector memoizado). Ao usá-los, prefira computar fora do seletor com `useMemo`, ou usar uma lib de memoização (ex. `reselect`) se a complexidade aumentar.

### Sem virtualização de tabela
A tabela de saldos tem no máximo 31 linhas (um mês) — não é gargalo hoje. Vale reavaliar se a tela "horizonte" (projeção multi-mês) renderizar muitos meses de uma vez sem paginação.

---

## Checklist de segurança para a migração ao Supabase

Integração básica com Supabase já implementada em v1.0 (localStorage fallback ativo). Antes de ir para **produção com autenticação de usuários**, validar:

### Implementado ✅
- [x] Cliente Supabase configurado em `src/lib/supabase.ts` com CRUD functions
- [x] Sync async fire-and-forget em `src/store/index.ts` com fallback graceful
- [x] Variáveis de ambiente em `.env.example` (usuário configura em `.env.local`)
- [x] `SUPABASE_SETUP.md` com guia de setup e checklist de RLS

### Pendente antes de produção ⏳
- [ ] **Row Level Security (RLS) habilitado** em `transactions` e `tags`, com policy `user_id = auth.uid()` para SELECT/INSERT/UPDATE/DELETE — sem isso, qualquer usuário autenticado acessa dados de todos os outros
- [ ] Nunca usar a **service_role key** no client (só a `anon` key, que é pública por design e depende 100% do RLS para proteger os dados)
- [ ] `.gitignore` atualizado para excluir `.env.local` (arquivo já existe, validar que `.env*` está marcado)
- [ ] Rate limiting / proteção contra brute-force no login (configurável no painel do Supabase Auth)
- [ ] **Autenticação de usuários** implementada — hoje o sync é anônimo (sem user_id); ao adicionar auth, garantir que `user_id` é populado corretamente em transactions/tags
- [ ] Migração dos dados do `localStorage` para a conta do usuário deve ocorrer **depois** da autenticação, nunca antes (evitar vazar dados locais de um dispositivo para a conta errada em caso de sessão compartilhada)
- [ ] Corrigir o bug de fuso horário (seção acima) **antes** da migração — evita propagar datas erradas para o banco definitivo
- [ ] Testar RLS policies com dados de teste (inserir como user A, tentar ler como user B — deve falhar)
