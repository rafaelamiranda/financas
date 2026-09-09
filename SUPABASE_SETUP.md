# Supabase Setup Guide

This app can optionally use Supabase as a backend for persistent data storage. Currently, it uses localStorage by default.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in:
   - Name: `financas` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your location
4. Click "Create new project"

### 2. Create Tables

Once your project is ready, go to the SQL Editor and run this SQL to create the tables:

```sql
-- Create transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'diario', 'economia', 'cartao')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'fixed_until')),
  recurrence_end_date TIMESTAMP,
  tag_ids TEXT[] DEFAULT '{}'::text[]
);

-- Create tags table
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

### 3. Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (supabase_url)
   - **anon public** (supabase_anon_key)

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Restart the dev server:
   ```bash
   npm run dev
   ```

### 5. Enable RLS (Row Level Security) - Optional

For a production app, enable RLS on your tables:

```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Allow all reads (public)
CREATE POLICY "allow_read" ON transactions FOR SELECT USING (true);
CREATE POLICY "allow_read" ON tags FOR SELECT USING (true);

-- Allow all writes (for now - implement auth later)
CREATE POLICY "allow_write" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_write" ON transactions FOR UPDATE USING (true);
CREATE POLICY "allow_write" ON transactions FOR DELETE USING (true);
CREATE POLICY "allow_write" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_write" ON tags FOR UPDATE USING (true);
CREATE POLICY "allow_write" ON tags FOR DELETE USING (true);
```

## Current Implementation Status

✅ Supabase client initialized  
✅ Database functions created (CRUD operations)  
⏳ Integration with Zustand store (next step)  
⏳ Real-time sync (future enhancement)  
⏳ Authentication (future enhancement)  

## Fallback to localStorage

If Supabase is not configured, the app automatically falls back to localStorage. This allows the app to work offline or without backend configuration.

## Future Enhancements

- Authentication (Google, GitHub, Email)
- Real-time subscriptions for multi-device sync
- Cloud backups
- Data export/import
