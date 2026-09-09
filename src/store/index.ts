import { create } from 'zustand';
import type { Transaction, Tag, TransactionType } from '../types';

interface FinancasStore {
  transactions: Transaction[];
  tags: Tag[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  deleteTag: (id: string) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  getTransactionsByMonth: (date: Date) => Transaction[];
  getTransactionsByType: (type: TransactionType, date?: Date) => Transaction[];
}

const loadFromStorage = (): { transactions: Transaction[]; tags: Tag[] } => {
  try {
    const stored = localStorage.getItem('financas_data');
    if (stored) {
      const data = JSON.parse(stored);
      return {
        transactions: data.transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date),
          created_at: new Date(t.created_at),
          recurrence_end_date: t.recurrence_end_date ? new Date(t.recurrence_end_date) : undefined,
        })),
        tags: data.tags,
      };
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return { transactions: [], tags: [] };
};

const saveToStorage = (transactions: Transaction[], tags: Tag[]) => {
  try {
    localStorage.setItem('financas_data', JSON.stringify({ transactions, tags }));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useFinancasStore = create<FinancasStore>((set, get) => {
  const initialData = loadFromStorage();

  return {
    transactions: initialData.transactions,
    tags: initialData.tags,

    addTransaction: (transaction) => {
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
        created_at: new Date(),
      };
      const transactions = [...get().transactions, newTransaction];
      set({ transactions });
      saveToStorage(transactions, get().tags);
    },

    deleteTransaction: (id) => {
      const transactions = get().transactions.filter((t) => t.id !== id);
      set({ transactions });
      saveToStorage(transactions, get().tags);
    },

    updateTransaction: (id, updates) => {
      const transactions = get().transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      set({ transactions });
      saveToStorage(transactions, get().tags);
    },

    addTag: (tag) => {
      const newTag: Tag = {
        ...tag,
        id: generateId(),
      };
      const tags = [...get().tags, newTag];
      set({ tags });
      saveToStorage(get().transactions, tags);
    },

    deleteTag: (id) => {
      const tags = get().tags.filter((t) => t.id !== id);
      const transactions = get().transactions.map((t) => ({
        ...t,
        tag_ids: t.tag_ids.filter((tid) => tid !== id),
      }));
      set({ tags, transactions });
      saveToStorage(transactions, tags);
    },

    updateTag: (id, updates) => {
      const tags = get().tags.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      set({ tags });
      saveToStorage(get().transactions, tags);
    },

    getTransactionsByMonth: (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      return get().transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      });
    },

    getTransactionsByType: (type, date) => {
      let transactions = get().transactions.filter((t) => t.type === type);
      if (date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        transactions = transactions.filter((t) => {
          const tDate = new Date(t.date);
          return tDate.getFullYear() === year && tDate.getMonth() === month;
        });
      }
      return transactions;
    },
  };
});
