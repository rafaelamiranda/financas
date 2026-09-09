import { createClient } from '@supabase/supabase-js';
import type { Transaction, Tag } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Using localStorage fallback.');
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseEnabled = !!supabase;

// Database operations
export async function fetchTransactions(): Promise<Transaction[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function fetchTags(): Promise<Tag[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export async function insertTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error inserting transaction:', error);
    return null;
  }
}

export async function updateTransactionRecord(id: string, updates: Partial<Transaction>) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    return null;
  }
}

export async function deleteTransactionRecord(id: string) {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
}

export async function insertTag(tag: Omit<Tag, 'id'>) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('tags')
      .insert([tag])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error inserting tag:', error);
    return null;
  }
}

export async function updateTagRecord(id: string, updates: Partial<Tag>) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating tag:', error);
    return null;
  }
}

export async function deleteTagRecord(id: string) {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting tag:', error);
    return false;
  }
}
