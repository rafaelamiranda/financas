import { useState } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinancasStore } from '../store';
import { calculateMonthlyTotals, formatCurrency, getMonthName } from '../utils';
import { CATEGORY_COLORS } from '../types';

export default function Horizonte() {
  const [startDate, setStartDate] = useState(new Date());
  const transactions = useFinancasStore((state) => state.transactions);

  const calculateProjection = (date: Date) => {
    const totals = calculateMonthlyTotals(transactions, date);
    return totals;
  };

  const getCurrentBalance = (): number => {
    const allTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate <= new Date();
    });

    return allTransactions.reduce((balance, t) => {
      const change = t.type === 'entrada' ? t.amount : -t.amount;
      return balance + change;
    }, 0);
  };

  const projections = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i);
    const totals = calculateProjection(monthDate);
    const balance = getCurrentBalance() + Array.from({ length: i }, (_, j) => {
      const jDate = new Date(startDate.getFullYear(), startDate.getMonth() + j);
      const jTotals = calculateProjection(jDate);
      return jTotals.entrada - jTotals.saida - jTotals.diario - jTotals.economia;
    }).reduce((a, b) => a + b, 0);

    return {
      date: monthDate,
      ...totals,
      projectedBalance: balance,
    };
  });

  const prevMonth = () => {
    setStartDate(new Date(startDate.getFullYear(), startDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setStartDate(new Date(startDate.getFullYear(), startDate.getMonth() + 1));
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-card-dark border-b border-card-hover/20 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            horizonte
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded-lg transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-gray-300 min-w-40 text-center">
              {getMonthName(startDate)}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded-lg transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24 md:pb-0">
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
          {projections.map((proj) => {
            const performance = proj.entrada - proj.saida - proj.diario - proj.economia;
            const isNegative = proj.projectedBalance < 0;
            const isLow = proj.projectedBalance < 500 && proj.projectedBalance >= 0;
            const isGood = proj.projectedBalance >= 500 && proj.projectedBalance < 2000;
            const isGreat = proj.projectedBalance >= 2000;

            let bgColor = 'bg-red-900/40';
            let borderColor = 'border-red-900/50';
            let textColor = 'text-red-400';

            if (!isNegative) {
              if (isGreat) {
                bgColor = 'bg-green-900/40';
                borderColor = 'border-green-900/50';
                textColor = 'text-green-400';
              } else if (isGood) {
                bgColor = 'bg-green-900/20';
                borderColor = 'border-green-900/30';
                textColor = 'text-green-400';
              } else if (isLow) {
                bgColor = 'bg-yellow-900/30';
                borderColor = 'border-yellow-900/50';
                textColor = 'text-yellow-400';
              }
            }

            return (
              <div
                key={proj.date.getTime()}
                className={`rounded-lg border p-4 transition ${bgColor} ${borderColor}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">
                      {proj.date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className={`font-bold text-lg ${textColor}`}>
                      Saldo: {formatCurrency(proj.projectedBalance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">Performance do mês</p>
                    <p className={`font-bold ${performance >= 0 ? 'text-entrada' : 'text-saida'}`}>
                      {formatCurrency(performance)}
                    </p>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Entradas</p>
                    <p className="font-semibold" style={{ color: CATEGORY_COLORS.entrada }}>
                      {formatCurrency(proj.entrada)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Saídas</p>
                    <p className="font-semibold" style={{ color: CATEGORY_COLORS.saida }}>
                      {formatCurrency(proj.saida)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Diários</p>
                    <p className="font-semibold" style={{ color: CATEGORY_COLORS.diario }}>
                      {formatCurrency(proj.diario)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Economia</p>
                    <p className="font-semibold" style={{ color: CATEGORY_COLORS.economia }}>
                      {formatCurrency(proj.economia)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Cartão</p>
                    <p className="font-semibold" style={{ color: CATEGORY_COLORS.cartao }}>
                      {formatCurrency(proj.cartao)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Info */}
          <div className="bg-card-hover/20 border border-card-hover/50 rounded-lg p-4 mt-6">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">Nota:</span> A projeção usa os dados de transações recorrentes já criadas.
              Adicione transações recorrentes na tela de adição para que apareçam aqui.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
