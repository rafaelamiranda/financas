import type { Transaction, DailyBalance } from './types';

export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
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

  let accumulatedBalance = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dayTransactions = transactions.filter((t) => {
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

    accumulatedBalance = accumulatedBalance + entrada - saida - diario - economia;

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
  const monthTransactions = transactions.filter((t) => {
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

export const getHeatmapColor = (balance: number, today: Date, dayDate: Date): string => {
  const isToday = (
    today.getFullYear() === dayDate.getFullYear() &&
    today.getMonth() === dayDate.getMonth() &&
    today.getDate() === dayDate.getDate()
  );

  if (isToday) {
    return 'bg-card-hover';
  }

  if (balance < 0) {
    return 'bg-red-900/40';
  } else if (balance < 500) {
    return 'bg-yellow-900/30';
  } else if (balance < 2000) {
    return 'bg-green-900/20';
  } else {
    return 'bg-green-900/40';
  }
};
