export type TransactionType = 'entrada' | 'saida' | 'diario' | 'economia' | 'cartao';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'fixed_until';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  recurrence: RecurrenceType;
  recurrence_end_date?: Date;
  recurrence_count?: number;
  tag_ids: string[];
  created_at: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface DailyBalance {
  date: Date;
  entrada: number;
  saida: number;
  diario: number;
  economia: number;
  cartao: number;
  saldo: number;
}

export const CATEGORY_COLORS: Record<TransactionType, string> = {
  entrada: '#7ED957',
  saida: '#FF6B6B',
  diario: '#FF69B4',
  economia: '#ADFF2F',
  cartao: '#9D4EDD',
};

export const CATEGORY_LABELS: Record<TransactionType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  diario: 'Diário',
  economia: 'Economia',
  cartao: 'Cartão',
};

export const TAG_COLOR_PRESETS = [
  '#7ED957', // Green
  '#FF6B6B', // Red
  '#FF69B4', // Pink
  '#ADFF2F', // Lime
  '#9D4EDD', // Purple
  '#00BCD4', // Cyan
  '#FFA500', // Orange
  '#4ECDC4', // Teal
];
