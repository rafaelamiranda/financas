import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'info';
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const AUTO_DISMISS_MS = 5000;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => {
      get().removeToast(id);
    }, AUTO_DISMISS_MS);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
