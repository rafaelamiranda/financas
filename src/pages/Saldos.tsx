import { useState } from 'react';
import type { Transaction } from '../types';
import { useFinancasStore } from '../store';
import { formatCurrency } from '../utils';
import { CATEGORY_COLORS } from '../types';
import MonthTable from '../components/MonthTable';
import EditTransactionModal from '../components/EditTransactionModal';
import { useMonthsToShow } from '../hooks/useMediaQuery';

export default function Saldos() {
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<Transaction[]>([]);
  const transactions = useFinancasStore((state) => state.transactions);
  const monthsToShow = useMonthsToShow();

  const handlePrevMonth = () => {
    setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const visibleMonths = Array.from({ length: monthsToShow }, (_, i) => {
    return new Date(anchorDate.getFullYear(), anchorDate.getMonth() + i, 1);
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 md:top-0 bg-card-dark border-b border-card-hover/20 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">saldos</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
              className="p-2 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded-lg transition"
            >
              ‹
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Próximo mês"
              className="p-2 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded-lg transition"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24 md:pb-0">
        <div className="p-4 md:p-6 flex gap-6 overflow-x-auto items-start">
          {visibleMonths.map((monthDate) => (
            <MonthTable
              key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
              date={monthDate}
              transactions={transactions}
              onSelectDay={setSelectedDayTransactions}
              onEditTransaction={setEditingTransaction}
            />
          ))}
        </div>
      </div>

      {selectedDayTransactions.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-card-dark w-full md:w-96 rounded-t-lg md:rounded-lg p-4 space-y-3 max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-bold text-white mb-4">Selecione a transação</h3>
            {selectedDayTransactions.map((transaction) => (
              <button
                key={transaction.id}
                onClick={() => {
                  setEditingTransaction(transaction);
                  setSelectedDayTransactions([]);
                }}
                className="w-full p-3 rounded-lg bg-card-hover/50 hover:bg-card-hover transition text-left border-l-4"
                style={{ borderColor: CATEGORY_COLORS[transaction.type] }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{transaction.description}</p>
                    <p className="text-xs text-gray-400">{transaction.type}</p>
                  </div>
                  <p className="font-bold text-white">{formatCurrency(transaction.amount)}</p>
                </div>
              </button>
            ))}
            <button
              onClick={() => setSelectedDayTransactions([])}
              className="w-full py-2 rounded-lg bg-card-hover/30 hover:bg-card-hover/50 text-gray-400 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <EditTransactionModal
        isOpen={editingTransaction !== null}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />
    </div>
  );
}
