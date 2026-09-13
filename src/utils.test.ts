import { describe, it, expect } from 'vitest';
import {
  generateRecurringTransactions,
  calculateDailyBalances,
  getHeatmapColor,
  formatCurrency,
  getDaysInMonth,
  parseLocalDate,
} from './utils';
import type { Transaction } from './types';

describe('utils', () => {
  describe('parseLocalDate', () => {
    it('should parse valid date string', () => {
      const date = parseLocalDate('2024-09-13');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(8);
      expect(date.getDate()).toBe(13);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive values', () => {
      const result = formatCurrency(1000);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle negative values', () => {
      const result = formatCurrency(-500);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle decimals', () => {
      const result = formatCurrency(123.45);
      expect(result).toBeDefined();
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toBeDefined();
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct days for each month', () => {
      expect(getDaysInMonth(new Date(2024, 0, 1))).toBe(31); // January
      expect(getDaysInMonth(new Date(2024, 3, 1))).toBe(30); // April
      expect(getDaysInMonth(new Date(2024, 1, 1))).toBe(29); // February (leap year)
      expect(getDaysInMonth(new Date(2023, 1, 1))).toBe(28); // February (non-leap)
    });
  });

  describe('getHeatmapColor', () => {
    it('should return correct color for high balance', () => {
      const color = getHeatmapColor(2500);
      expect(color.style?.backgroundColor).toBe('#1a5d1a');
    });

    it('should return correct color for medium balance', () => {
      const color = getHeatmapColor(1500);
      expect(color.style?.backgroundColor).toBe('#4ade80');
    });

    it('should return correct color for low positive balance', () => {
      const color = getHeatmapColor(500);
      expect(color.style?.backgroundColor).toBe('#A07A00');
    });

    it('should return correct color for negative balance', () => {
      const color = getHeatmapColor(-100);
      expect(color.style?.backgroundColor).toBe('#fca5a5');
    });

    it('should return correct color for very negative balance', () => {
      const color = getHeatmapColor(-1000);
      expect(color.style?.backgroundColor).toBe('#991b1b');
    });
  });

  describe('generateRecurringTransactions', () => {
    const baseTransaction: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 1000,
      description: 'Test',
      date: new Date(2024, 8, 1),
      recurrence: 'none',
      tag_ids: [],
      created_at: new Date(),
    };

    it('should return empty for non-recurring', () => {
      const result = generateRecurringTransactions(baseTransaction, new Date(2024, 8, 30));
      expect(result).toEqual([]);
    });

    it('should generate daily recurrence', () => {
      const tx: Transaction = { ...baseTransaction, recurrence: 'daily' };
      const result = generateRecurringTransactions(tx, new Date(2024, 8, 3));
      expect(result.length).toBeGreaterThan(0);
    });

    it('should respect recurrence_count', () => {
      const tx: Transaction = { ...baseTransaction, recurrence: 'daily', recurrence_count: 3 };
      const result = generateRecurringTransactions(tx, new Date(2024, 8, 10));
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should generate monthly recurrence', () => {
      const tx: Transaction = { ...baseTransaction, recurrence: 'monthly' };
      const result = generateRecurringTransactions(tx, new Date(2024, 10, 1));
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate weekly recurrence', () => {
      const tx: Transaction = { ...baseTransaction, recurrence: 'weekly' };
      const result = generateRecurringTransactions(tx, new Date(2024, 8, 15));
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('calculateDailyBalances', () => {
    it('should calculate balances for a month', () => {
      const transaction: Transaction = {
        id: '1',
        type: 'entrada',
        amount: 1000,
        description: 'Income',
        date: new Date(2024, 8, 15),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      };

      const result = calculateDailyBalances([transaction], new Date(2024, 8, 1));
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].date.getDate()).toBe(1);
    });

    it('should accumulate saldo correctly', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          type: 'entrada',
          amount: 1000,
          description: 'Income',
          date: new Date(2024, 8, 1),
          recurrence: 'none',
          tag_ids: [],
          created_at: new Date(),
        },
        {
          id: '2',
          type: 'saida',
          amount: 200,
          description: 'Expense',
          date: new Date(2024, 8, 5),
          recurrence: 'none',
          tag_ids: [],
          created_at: new Date(),
        },
      ];

      const result = calculateDailyBalances(transactions, new Date(2024, 8, 1));
      
      // First entry should have entrada
      expect(result[0].entrada).toBe(1000);
      
      // Fifth day should show the saida
      const day5 = result.find((d) => d.date.getDate() === 5);
      if (day5) {
        expect(day5.saida).toBe(200);
      }
    });

    it('should return consistent length', () => {
      const transaction: Transaction = {
        id: '1',
        type: 'entrada',
        amount: 1000,
        description: 'Income',
        date: new Date(2024, 8, 15),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      };

      const result = calculateDailyBalances([transaction], new Date(2024, 8, 1));
      
      // Should have at least the days in the month
      expect(result.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe('edge cases', () => {
    it('should handle empty transaction list', () => {
      const result = calculateDailyBalances([], new Date(2024, 8, 1));
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle transaction at month boundary', () => {
      const transaction: Transaction = {
        id: '1',
        type: 'entrada',
        amount: 1000,
        description: 'Income',
        date: new Date(2024, 8, 30),
        recurrence: 'none',
        tag_ids: [],
        created_at: new Date(),
      };

      const result = calculateDailyBalances([transaction], new Date(2024, 8, 1));
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
