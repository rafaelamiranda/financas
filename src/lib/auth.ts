import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  if (!supabase) {
    return { user: null, error: 'Supabase não está configurado' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data?.user || null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao registrar';
    return { user: null, error: message };
  }
}

export async function signIn(email: string, password: string): Promise<{ session: Session | null; error: string | null }> {
  if (!supabase) {
    return { session: null, error: 'Supabase não está configurado' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { session: null, error: error.message };
    }

    return { session: data?.session || null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao entrar';
    return { session: null, error: message };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase não está configurado' };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao sair';
    return { error: message };
  }
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export function onAuthStateChange(callback: (session: Session | null, user: User | null) => void): () => void {
  if (!supabase) {
    callback(null, null);
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user || null;
    callback(session, user);
  });

  return () => {
    data?.subscription?.unsubscribe();
  };
}
