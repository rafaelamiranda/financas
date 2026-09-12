import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  formatCurrency,
  calculateDailyBalances,
  calculateMonthlyTotals,
  generateRecurringTransactions,
} from './utils';
import type { Transaction } from './types';

describe('parseLocalDate', () => {
  it('should parse ISO date string to a local Date without timezone shift', () => {
    const date = parseLocalDate('2025-01-31');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January (0-indexed)
    expect(date.getDate()).toBe(31);
  });

  it('should handle padded month and day', () => {
    const date = parseLocalDate('2025-01-05');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(5);
  });

  it('should handle year boundaries', () => {
    const date = parseLocalDate('2025-12-01');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11); // December
    expect(date.getDate()).toBe(1);
  });
});

describe('formatCurrency', () => {
  it('should format positive values as BRL with comma and dot placement', () => {
    const formatted = formatCurrency(1234.56);
    expect(formatted).toBe('R$ 1.234,56');
  });

  it('should format negative values with minus sign', () => {
    const formatted = formatCurrency(-100);
    expect(formatted).toBe('-R$ 100,00');
  });

  it('should format zero correctly', () => {
    const formatted = formatCurrency(0);
    expect(formatted).toBe('R$ 0,00');
  });

  it('should handle large numbers with proper grouping', () => {
    const formatted = formatCurrency(1000000.99);
    expect(formatted).toContain('R$');
    expect(formatted).toContain('1.000.000');
  });
});

describe('calculateDailyBalances', () => {
  it('should accumulate balance correctly with transactions across different days', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'entrada',
        amount: 1000,
        description: 'salary',
        date: parseLocalDate('2025-01-05'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '2',
        type: 'saida',
        amount: 200,
        description: 'groceries',
        date: parseLocalDate('2025-01-10'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '3',
        type: 'diario',
        amount: 50,
        description: 'coffee',
        date: parseLocalDate('2025-01-15'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '4',
        type: 'economia',
        amount: 100,
        description: 'savings',
        date: parseLocalDate('2025-01-20'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '5',
        type: 'cartao',
        amount: 75,
        description: 'credit card',
        date: parseLocalDate('2025-01-25'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
    ];

    const balances = calculateDailyBalances(transactions, parseLocalDate('2025-01-15'));

    // Day 5: +1000
    expect(balances[4].saldo).toBe(1000);
    expect(balances[4].entrada).toBe(1000);

    // Day 10: +1000 - 200 = 800
    expect(balances[9].saldo).toBe(800);
    expect(balances[9].saida).toBe(200);

    // Day 15: +1000 - 200 - 50 = 750
    expect(balances[14].saldo).toBe(750);
    expect(balances[14].diario).toBe(50);
  });

  it('should aggregate category sums per day', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'entrada',
        amount: 500,
        description: 'income',
        date: parseLocalDate('2025-01-01'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '2',
        type: 'entrada',
        amount: 300,
        description: 'bonus',
        date: parseLocalDate('2025-01-01'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
    ];

    const balances = calculateDailyBalances(transactions, parseLocalDate('2025-01-01'));
    expect(balances[0].entrada).toBe(800);
  });
});

describe('calculateMonthlyTotals', () => {
  it('should sum all transactions for the month', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'entrada',
        amount: 1000,
        description: 'salary',
        date: parseLocalDate('2025-01-05'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '2',
        type: 'saida',
        amount: 200,
        description: 'rent',
        date: parseLocalDate('2025-01-10'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '3',
        type: 'diario',
        amount: 50,
        description: 'food',
        date: parseLocalDate('2025-01-15'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '4',
        type: 'economia',
        amount: 100,
        description: 'savings',
        date: parseLocalDate('2025-01-20'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
    ];

    const totals = calculateMonthlyTotals(transactions, parseLocalDate('2025-01-15'));

    expect(totals.entrada).toBe(1000);
    expect(totals.saida).toBe(200);
    expect(totals.diario).toBe(50);
    expect(totals.economia).toBe(100);
    expect(totals.performance).toBe(650); // 1000 - 200 - 50 - 100
  });

  it('should calculate economized percentage', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'entrada',
        amount: 1000,
        description: 'salary',
        date: parseLocalDate('2025-01-05'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '2',
        type: 'economia',
        amount: 200,
        description: 'savings',
        date: parseLocalDate('2025-01-20'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
    ];

    const totals = calculateMonthlyTotals(transactions, parseLocalDate('2025-01-15'));
    expect(totals.economizedPercentage).toBe(20); // 200 / 1000 * 100
  });

  it('should return 0 economized percentage when entrada is 0', () => {
    const transactions: Transaction[] = [];

    const totals = calculateMonthlyTotals(transactions, parseLocalDate('2025-01-15'));
    expect(totals.economizedPercentage).toBe(0);
  });

  it('should calculate cost of living as saida + diario + cartao', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'entrada',
        amount: 1000,
        description: 'salary',
        date: parseLocalDate('2025-01-05'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '2',
        type: 'saida',
        amount: 300,
        description: 'rent',
        date: parseLocalDate('2025-01-10'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '3',
        type: 'diario',
        amount: 50,
        description: 'food',
        date: parseLocalDate('2025-01-15'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
      {
        id: '4',
        type: 'cartao',
        amount: 100,
        description: 'credit card',
        date: parseLocalDate('2025-01-20'),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      },
    ];

    const totals = calculateMonthlyTotals(transactions, parseLocalDate('2025-01-15'));
    expect(totals.costOfLiving).toBe(450); // 300 + 50 + 100
  });
});

describe('generateRecurringTransactions', () => {
  it('should generate daily recurrence transactions', () => {
    const transaction: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      description: 'daily income',
      date: parseLocalDate('2025-01-01'),
      recurrence: 'daily',
      tag_ids: [],
      created_at: new Date(),
    };

    const endDate = parseLocalDate('2025-01-05');
    const recurring = generateRecurringTransactions(transaction, endDate);

    expect(recurring).toHaveLength(4); // Jan 2, 3, 4, 5
    expect(recurring[0].date.getDate()).toBe(2);
    expect(recurring[1].date.getDate()).toBe(3);
  });

  it('should generate weekly recurrence transactions', () => {
    const transaction: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      description: 'weekly income',
      date: parseLocalDate('2025-01-01'),
      recurrence: 'weekly',
      tag_ids: [],
      created_at: new Date(),
    };

    const endDate = parseLocalDate('2025-01-31');
    const recurring = generateRecurringTransactions(transaction, endDate);

    expect(recurring.length).toBeGreaterThan(0);
    expect(recurring[0].date.getDate()).toBe(8); // Jan 8
    expect(recurring[1].date.getDate()).toBe(15); // Jan 15
  });

  it('should generate monthly recurrence transactions', () => {
    const transaction: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      description: 'monthly income',
      date: parseLocalDate('2025-01-05'),
      recurrence: 'monthly',
      tag_ids: [],
      created_at: new Date(),
    };

    const endDate = parseLocalDate('2025-03-31');
    const recurring = generateRecurringTransactions(transaction, endDate);

    expect(recurring).toHaveLength(2); // Feb 5, Mar 5
    expect(recurring[0].date.getMonth()).toBe(1); // February
    expect(recurring[0].date.getDate()).toBe(5);
    expect(recurring[1].date.getMonth()).toBe(2); // March
    expect(recurring[1].date.getDate()).toBe(5);
  });

  it('should generate fixed_until recurrence transactions', () => {
    const transaction: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      description: 'fixed income',
      date: parseLocalDate('2025-01-05'),
      recurrence: 'fixed_until',
      tag_ids: [],
      created_at: new Date(),
    };

    const endDate = parseLocalDate('2025-03-31');
    const recurring = generateRecurringTransactions(transaction, endDate);

    expect(recurring).toHaveLength(2); // Feb 5, Mar 5
  });

  it('should not exceed recurrence_end_date', () => {
    const transaction: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      description: 'limited income',
      date: parseLocalDate('2025-01-05'),
      recurrence: 'monthly',
      recurrence_end_date: parseLocalDate('2025-02-28'),
      tag_ids: [],
      created_at: new Date(),
    };

    const endDate = parseLocalDate('2025-12-31');
    const recurring = generateRecurringTransactions(transaction, endDate);

    expect(recurring).toHaveLength(1); // Only Feb 5
    expect(recurring[0].date.getMonth()).toBe(1); // February
    expect(recurring[0].date.getDate()).toBe(5);
  });

  it('should return empty array for non-recurring transaction', () => {
    const transaction: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      description: 'one-time income',
      date: parseLocalDate('2025-01-05'),
      recurrence: 'none',
      tag_ids: [],
      created_at: new Date(),
    };

    const endDate = parseLocalDate('2025-12-31');
    const recurring = generateRecurringTransactions(transaction, endDate);

    expect(recurring).toHaveLength(0);
  });

  it('should generate unique IDs for recurring transactions', () => {
    const transaction: Transaction = {
      id: 'base-id',
      type: 'entrada',
      amount: 100,
      description: 'daily income',
      date: parseLocalDate('2025-01-01'),
      recurrence: 'daily',
      tag_ids: [],
      created_at: new Date(),
    };

    const endDate = parseLocalDate('2025-01-03');
    const recurring = generateRecurringTransactions(transaction, endDate);

    const ids = new Set(recurring.map((t) => t.id));
    expect(ids.size).toBe(recurring.length); // All IDs are unique
  });
});
