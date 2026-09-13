import { create } from 'zustand';
import type { Transaction, Tag, TransactionType } from '../types';
import { parseLocalDate } from '../utils';
import {
    isSupabaseEnabled,
    insertTransaction as insertSupabaseTransaction,
    updateTransactionRecord,
    deleteTransactionRecord,
    insertTag as insertSupabaseTag,
    updateTagRecord,
    deleteTagRecord,
} from '../lib/supabase';
import { useToastStore } from './toastStore';

interface FinancasStore {
    transactions: Transaction[];
    tags: Tag[];
    addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
    deleteTransaction: (id: string) => void;
    updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
    addTag: (tag: Omit<Tag, 'id' | 'order'>) => void;
    deleteTag: (id: string) => void;
    updateTag: (id: string, tag: Partial<Tag>) => void;
    reorderTags: (orderedIds: string[]) => void;
    getTransactionsByMonth: (date: Date) => Transaction[];
    getTransactionsByType: (type: TransactionType, date?: Date) => Transaction[];
}

const loadFromStorage = (): { transactions: Transaction[]; tags: Tag[] } => {
    try {
        const stored = localStorage.getItem('financas_data');
        if (stored) {
            const data = JSON.parse(stored);
            const rawTags: Tag[] = data.tags || [];
            // Migrate tags missing `order` (added in Fase A2) by assigning sequential index-based order.
            const needsMigration = rawTags.some((t) => typeof t.order !== 'number');
            const tags = needsMigration
                ? rawTags.map((t, index) => ({
                      ...t,
                      order: typeof t.order === 'number' ? t.order : index,
                  }))
                : rawTags;

            return {
                transactions: data.transactions.map((t: any) => {
                    const dateStr = typeof t.date === 'string' ? t.date.split('T')[0] : t.date;
                    const createdAtStr =
                        typeof t.created_at === 'string'
                            ? t.created_at.split('T')[0]
                            : t.created_at;
                    const recurrenceEndDateStr = t.recurrence_end_date
                        ? typeof t.recurrence_end_date === 'string'
                            ? t.recurrence_end_date.split('T')[0]
                            : t.recurrence_end_date
                        : undefined;

                    return {
                        ...t,
                        date: parseLocalDate(dateStr),
                        created_at: parseLocalDate(createdAtStr),
                        recurrence_end_date: recurrenceEndDateStr
                            ? parseLocalDate(recurrenceEndDateStr)
                            : undefined,
                    };
                }),
                tags,
            };
        }
    } catch (e) {
        console.error('Failed to load from storage:', e);
    }
    return { transactions: [], tags: [] };
};

const getStorageErrorMessage = (e: unknown): string => {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        return 'Armazenamento cheio. Não foi possível salvar suas alterações.';
    }
    return 'Não foi possível salvar. Verifique se o modo privado do navegador está bloqueando o armazenamento.';
};

/**
 * Persists to localStorage. Returns true on success, false on failure
 * (and reports the failure to the toast store) so callers can react.
 */
const saveToStorage = (transactions: Transaction[], tags: Tag[]): boolean => {
    try {
        localStorage.setItem('financas_data', JSON.stringify({ transactions, tags }));
        return true;
    } catch (e) {
        console.error('Failed to save to storage:', e);
        useToastStore.getState().addToast(getStorageErrorMessage(e), 'error');
        return false;
    }
};

// crypto.randomUUID() is required so ids stay compatible with Supabase's `uuid` primary key columns.
const generateId = () => crypto.randomUUID();

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

            // Sync to Supabase if available
            if (isSupabaseEnabled) {
                insertSupabaseTransaction(newTransaction).catch((err) => {
                    console.error('Failed to sync transaction to Supabase:', err);
                });
            }
        },

        deleteTransaction: (id) => {
            const transactions = get().transactions.filter((t) => t.id !== id);
            set({ transactions });
            saveToStorage(transactions, get().tags);

            if (isSupabaseEnabled) {
                deleteTransactionRecord(id).catch((err) => {
                    console.error('Failed to delete transaction from Supabase:', err);
                });
            }
        },

        updateTransaction: (id, updates) => {
            const transactions = get().transactions.map((t) =>
                t.id === id ? { ...t, ...updates } : t
            );
            set({ transactions });
            saveToStorage(transactions, get().tags);

            if (isSupabaseEnabled) {
                updateTransactionRecord(id, updates).catch((err) => {
                    console.error('Failed to update transaction in Supabase:', err);
                });
            }
        },

        addTag: (tag) => {
            const existingTags = get().tags;
            const maxOrder = existingTags.reduce((max, t) => Math.max(max, t.order ?? 0), -1);
            const newTag: Tag = {
                ...tag,
                id: generateId(),
                order: maxOrder + 1,
            };
            const tags = [...existingTags, newTag];
            set({ tags });
            saveToStorage(get().transactions, tags);

            if (isSupabaseEnabled) {
                insertSupabaseTag(newTag).catch((err) => {
                    console.error('Failed to sync tag to Supabase:', err);
                });
            }
        },

        deleteTag: (id) => {
            const tags = get().tags.filter((t) => t.id !== id);
            const transactions = get().transactions.map((t) => ({
                ...t,
                tag_ids: t.tag_ids.filter((tid) => tid !== id),
            }));
            set({ tags, transactions });
            saveToStorage(transactions, tags);

            if (isSupabaseEnabled) {
                deleteTagRecord(id).catch((err) => {
                    console.error('Failed to delete tag from Supabase:', err);
                });
            }
        },

        updateTag: (id, updates) => {
            const tags = get().tags.map((t) => (t.id === id ? { ...t, ...updates } : t));
            set({ tags });
            saveToStorage(get().transactions, tags);

            if (isSupabaseEnabled) {
                updateTagRecord(id, updates).catch((err) => {
                    console.error('Failed to update tag in Supabase:', err);
                });
            }
        },

        reorderTags: (orderedIds) => {
            const tagsById = new Map(get().tags.map((t) => [t.id, t]));
            const tags = orderedIds
                .map((id, index) => {
                    const tag = tagsById.get(id);
                    return tag ? { ...tag, order: index } : undefined;
                })
                .filter((t): t is Tag => t !== undefined);

            // Preserve any tags not included in orderedIds (defensive, shouldn't normally happen)
            const reorderedIds = new Set(orderedIds);
            const remaining = get().tags.filter((t) => !reorderedIds.has(t.id));

            const nextTags = [...tags, ...remaining];
            set({ tags: nextTags });
            saveToStorage(get().transactions, nextTags);

            // TODO(Fase D): sync tag order to Supabase once Auth/backend lands (needs `order` column + user_id scoping).
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
