import type { Transaction, DailyBalance } from './types';

export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const generateRecurringTransactions = (
  transaction: Transaction,
  endDate: Date
): Transaction[] => {
  const recurring: Transaction[] = [];

  if (transaction.recurrence === 'none') {
    return [];
  }

  let currentDate = new Date(
    transaction.date.getFullYear(),
    transaction.date.getMonth(),
    transaction.date.getDate()
  );

  const maxEndDate = transaction.recurrence_end_date
    ? new Date(
        transaction.recurrence_end_date.getFullYear(),
        transaction.recurrence_end_date.getMonth(),
        transaction.recurrence_end_date.getDate()
      )
    : endDate;

  const queryEndDate = endDate > maxEndDate ? maxEndDate : endDate;
  let occurrenceCount = 0;

  while (currentDate <= queryEndDate) {
    if (
      currentDate > new Date(
        transaction.date.getFullYear(),
        transaction.date.getMonth(),
        transaction.date.getDate()
      )
    ) {
      // Check if we've reached the max count
      if (transaction.recurrence_count && occurrenceCount >= transaction.recurrence_count - 1) {
        break;
      }

      recurring.push({
        ...transaction,
        id: `${transaction.id}-recurring-${currentDate.getTime()}`,
        date: new Date(currentDate),
      });
      occurrenceCount++;
    }

    switch (transaction.recurrence) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'fixed_until':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        return recurring;
    }
  }

  return recurring;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
};

export const getMonthName = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const calculateDailyBalances = (transactions: Transaction[], date: Date): DailyBalance[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(date);
  const balances: DailyBalance[] = [];

  const monthEnd = new Date(year, month + 1, 0);

  const allTransactions: Transaction[] = [];
  for (const t of transactions) {
    allTransactions.push(t);
    const recurring = generateRecurringTransactions(t, monthEnd);
    allTransactions.push(...recurring);
  }

  // Calcular saldo final do mês anterior para continuar a partir daí
  let accumulatedBalance = 0;
  if (month > 0 || year > new Date().getFullYear()) {
    const prevMonthDate = new Date(year, month - 1, 1);
    const prevMonthTransactions = allTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === prevMonthDate.getFullYear() && tDate.getMonth() === prevMonthDate.getMonth();
    });

    accumulatedBalance = prevMonthTransactions
      .reduce((sum, t) => {
        if (t.type === 'entrada') return sum + t.amount;
        if (t.type === 'saida' || t.type === 'diario' || t.type === 'economia') return sum - t.amount;
        return sum;
      }, 0);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dayTransactions = allTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getFullYear() === year &&
        tDate.getMonth() === month &&
        tDate.getDate() === day
      );
    });

    const entrada = dayTransactions
      .filter((t) => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const saida = dayTransactions
      .filter((t) => t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0);

    const diario = dayTransactions
      .filter((t) => t.type === 'diario')
      .reduce((sum, t) => sum + t.amount, 0);

    const economia = dayTransactions
      .filter((t) => t.type === 'economia')
      .reduce((sum, t) => sum + t.amount, 0);

    const cartao = dayTransactions
      .filter((t) => t.type === 'cartao')
      .reduce((sum, t) => sum + t.amount, 0);

    accumulatedBalance = accumulatedBalance + entrada - saida - diario - economia - cartao;

    balances.push({
      date: dayDate,
      entrada,
      saida,
      diario,
      economia,
      cartao,
      saldo: accumulatedBalance,
    });
  }

  return balances;
};

export const calculateMonthlyTotals = (transactions: Transaction[], date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const monthEnd = new Date(year, month + 1, 0);

  const allTransactions: Transaction[] = [];
  for (const t of transactions) {
    allTransactions.push(t);
    const recurring = generateRecurringTransactions(t, monthEnd);
    allTransactions.push(...recurring);
  }

  const monthTransactions = allTransactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate.getFullYear() === year && tDate.getMonth() === month;
  });

  const entrada = monthTransactions
    .filter((t) => t.type === 'entrada')
    .reduce((sum, t) => sum + t.amount, 0);

  const saida = monthTransactions
    .filter((t) => t.type === 'saida')
    .reduce((sum, t) => sum + t.amount, 0);

  const diario = monthTransactions
    .filter((t) => t.type === 'diario')
    .reduce((sum, t) => sum + t.amount, 0);

  const economia = monthTransactions
    .filter((t) => t.type === 'economia')
    .reduce((sum, t) => sum + t.amount, 0);

  const cartao = monthTransactions
    .filter((t) => t.type === 'cartao')
    .reduce((sum, t) => sum + t.amount, 0);

  const performance = entrada - saida - diario - economia - cartao;
  const economizedPercentage = entrada > 0 ? (economia / entrada) * 100 : 0;
  const costOfLiving = saida + diario + cartao;

  return {
    entrada,
    saida,
    diario,
    economia,
    cartao,
    performance,
    economizedPercentage,
    costOfLiving,
  };
};

export const getHeatmapColor = (balance: number): { className: string; style?: Record<string, string> } => {
  if (balance > 2000) {
    return { className: '', style: { backgroundColor: '#1a5d1a' } };
  } else if (balance >= 1000) {
    return { className: '', style: { backgroundColor: '#4ade80' } };
  } else if (balance >= 0) {
    return { className: '', style: { backgroundColor: '#A07A00' } };
  } else if (balance >= -500) {
    return { className: '', style: { backgroundColor: '#fca5a5' } };
  } else {
    return { className: '', style: { backgroundColor: '#991b1b' } };
  }
};

export const validateTransactionAmount = (amount: number): { valid: boolean; error?: string } => {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Valor deve ser maior que 0' };
  }
  if (amount > 999999.99) {
    return { valid: false, error: 'Valor não pode ser maior que R$ 999.999,99' };
  }
  return { valid: true };
};

export const validateTransactionDate = (date: Date): { valid: boolean; error?: string } => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return { valid: false, error: 'Data inválida' };
  }
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  if (date < oneYearAgo || date > oneYearFromNow) {
    return { valid: false, error: 'Data deve estar dentro de 1 ano no passado ou futuro' };
  }
  return { valid: true };
};

export const validateRecurrenceCount = (count: string, recurrenceMode: 'infinite' | 'count'): { valid: boolean; error?: string; value?: number } => {
  if (recurrenceMode === 'infinite') {
    return { valid: true };
  }

  const parsed = parseInt(count, 10);
  if (isNaN(parsed) || parsed < 1) {
    return { valid: false, error: 'Número de ocorrências deve ser pelo menos 1' };
  }
  if (parsed > 999) {
    return { valid: false, error: 'Número de ocorrências não pode ser maior que 999' };
  }
  return { valid: true, value: parsed };
};
