# Supabase Setup Guide

**Integração OBRIGATÓRIA com Supabase** para autenticação e sincronização multi-dispositivo. O app requer login com Supabase Auth — não há modo offline sem autenticação.

O app usa **localStorage offline-first** como cache local e **Supabase Postgres** como fonte de verdade, com sync automático após login.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New project"
3. Preencha:
   - **Project name**: `financas`
   - **Database password**: Crie uma senha forte (salve em local seguro)
   - **Region**: São Paulo (`south-america-east-1`) para latência mínima
4. Clique em "Create new project"
5. Aguarde 2-3 minutos até o projeto estar pronto

## 2. Criar Tabelas com RLS

No painel do Supabase, vá para **SQL Editor** e execute:

```sql
-- Tabela de transações
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('entrada', 'saida', 'diario', 'economia', 'cartao')),
  amount numeric not null,
  description text,
  date date not null,
  recurrence text default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'fixed_until')),
  recurrence_end_date date,
  tag_ids uuid[],
  created_at timestamp default now() not null,
  updated_at timestamp default now() not null
);

-- Tabela de tags
create table tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  order integer default 0 not null,
  created_at timestamp default now() not null
);

-- Índices para performance
create index transactions_user_id_idx on transactions(user_id);
create index transactions_date_idx on transactions(date);
create index tags_user_id_idx on tags(user_id);

-- Habilitar Row Level Security
alter table transactions enable row level security;
alter table tags enable row level security;

-- RLS Policies: cada usuário só vê/edita seus dados
create policy "Users can only see their own transactions" on transactions
  for select using (auth.uid() = user_id);

create policy "Users can only insert their own transactions" on transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can only update their own transactions" on transactions
  for update using (auth.uid() = user_id);

create policy "Users can only delete their own transactions" on transactions
  for delete using (auth.uid() = user_id);

create policy "Users can only see their own tags" on tags
  for select using (auth.uid() = user_id);

create policy "Users can only insert their own tags" on tags
  for insert with check (auth.uid() = user_id);

create policy "Users can only update their own tags" on tags
  for update using (auth.uid() = user_id);

create policy "Users can only delete their own tags" on tags
  for delete using (auth.uid() = user_id);
```

## 3. Obter Credenciais

1. No painel, vá para **Settings → API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

**⚠️ Importante**: Use apenas a chave `anon` (public) no frontend. A chave `service_role` é só para backend.

## 4. Configurar `.env.local` **(OBRIGATÓRIO)**

1. Na raiz do projeto, crie `.env.local`:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Substitua** com suas credenciais copiadas (do Supabase Settings → API)
3. **CRÍTICO**: sem estas variáveis, o app **não iniciará** (Auth é obrigatório)
4. O arquivo `.gitignore` já exclui `.env.local` — não será commitado

## 5. Testar no App

```bash
npm run dev
```

1. Abra http://localhost:5173
2. Vá para **Menu → Sobre**
3. Deve mostrar "Supabase sync: Ativo"

4. Adicione uma transação de teste
5. Verifique no Supabase SQL Editor:
   ```sql
   select * from transactions limit 1;
   ```
   Deve aparecer a transação criada.

## 6. Verificar RLS Policies

1. No painel, vá para **Authentication → Policies**
2. Confirme que as **8 policies** foram criadas (4 para `transactions`, 4 para `tags`)
3. Todas devem estar **habilitadas** (ícone de cadeado verde)

**⚠️ Crítico**: sem RLS, qualquer usuário autenticado lê dados de qualquer outro usuário.

## Próximos Passos Antes de Produção

- [ ] **Autenticação de usuários** — implementar login/register via Supabase Auth
- [ ] **Migração de dados** — transferir localStorage para conta do usuário após login
- [ ] **Rate limiting** — configurar proteção contra brute-force
- [ ] **Testes de RLS** — inserir como user A, tentar ler como user B (deve falhar)
- [ ] **Corrigir bug de fuso horário** — ver `SECURITY.md` (affects date storage)

## 7. Verificar Row Level Security (RLS) — Teste Manual

**CRÍTICO**: sem RLS, qualquer usuário autenticado lê/escreve dados de qualquer outro usuário.

### Procedimento de verificação:
1. Crie **duas contas de teste** via sign up no app:
   - **Account A**: `user-a@test.com` / senha
   - **Account B**: `user-b@test.com` / senha

2. **Logado como Account A**:
   - Adicione uma transação (ex: "Salário R$ 5000")
   - Verifique no Supabase SQL Editor:
     ```sql
     select id, description, amount, user_id from transactions where description = 'Salário';
     ```
   - Deve aparecer com `user_id = A`

3. **Logado como Account B**:
   - Vá para Browser do Supabase e execute:
     ```sql
     select id, description, user_id from transactions;
     ```
   - **Esperado**: resultado vazio (não vê dados de A)
   - **Erro**: se vir dados de A, RLS não está funcionando!

4. **Teste de insert bloqueado**:
   - Como Account B, no SQL Editor (sem Auth context):
     ```sql
     insert into transactions (user_id, type, amount, description, date)
     values ('00000000-0000-0000-0000-000000000000', 'entrada', 100, 'hack', now());
     ```
   - **Esperado**: erro de RLS policy
   - **Aceito**: Postgres recusa se o UUID não existir

### Se RLS não funciona:
1. Verifique se as 8 policies estão **habilitadas** (ícone de cadeado verde) em Settings → Security → Policies
2. Recrie as policies seguindo a seção 2
3. Logout completo e login novamente (limpar cache de session)

## 8. Rate Limiting (Proteção contra Brute-Force)

Por padrão, Supabase Auth tem proteção básica contra brute-force. Para customizar:

1. No painel do Supabase, vá para **Authentication → Settings → Rate Limiting**
2. Recomendado:
   - **Requests per minute**: 10 (limite de tentativas de login por IP/email)
   - **Enable CAPTCHAs**: Ativar para maiores níveis de segurança
3. Salve as alterações

Essa proteção é automática e não requer código no frontend.

---

## Troubleshooting

**"Supabase sync: Inativo"**
- Verifique `.env.local` existe na raiz
- Verifique credenciais (copie novamente de Settings → API)
- Reinicie `npm run dev`
- Abra console (F12) e procure por erros

**Dados não aparecem no Supabase**
- Verifique se tabelas foram criadas
- Verifique RLS policies (podem estar bloqueando inserts)
- Abra console do navegador para verificar erros de sync

---

Ver `SECURITY.md` para detalhes de segurança e checklist completo de RLS.
