# Supabase Setup Guide

Integração opcional com Supabase para sincronização multi-dispositivo. O app usa **localStorage offline-first** com sync assíncrono para Supabase.

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

## 4. Configurar `.env.local`

1. Na raiz do projeto, crie `.env.local`:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Substitua** com suas credenciais copiadas
3. O arquivo `.gitignore` já exclui `.env.local` — não será commitado

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

## Desabilitar Supabase (voltar para localStorage)

Se quiser usar só localStorage sem sync:

1. Delete ou comente em `.env.local`:
   ```
   # VITE_SUPABASE_URL=...
   # VITE_SUPABASE_ANON_KEY=...
   ```
2. Reinicie: `npm run dev`
3. App continuará 100% funcional offline

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
