import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthStore {
  session: Session | null;
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  setSession: (session: Session | null, user: User | null) => void;
  clearSession: () => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  authLoading: true,
  authError: null,

  setSession: (session, user) => {
    set({ session, user, authLoading: false, authError: null });
  },

  clearSession: () => {
    set({ session: null, user: null, authLoading: false, authError: null });
  },

  setAuthLoading: (loading) => {
    set({ authLoading: loading });
  },

  setAuthError: (error) => {
    set({ authError: error });
  },
}));
