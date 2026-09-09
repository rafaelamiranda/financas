import { useState } from 'react';
import { useFinancasStore } from '../store';
import { calculateDailyBalances, calculateMonthlyTotals, formatCurrency, getMonthName, getHeatmapColor } from '../utils';
import { CATEGORY_COLORS } from '../types';

export default function Saldos() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const transactions = useFinancasStore((state) => state.transactions);

  const dailyBalances = calculateDailyBalances(transactions, currentDate);
  const monthlyTotals = calculateMonthlyTotals(transactions, currentDate);
  const today = new Date();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const CategoryCell = ({ type, amount }: { type: string; amount: number }) => {
    if (amount === 0) {
      return <div className="text-gray-600 text-sm">-</div>;
    }
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: CATEGORY_COLORS[type as keyof typeof CATEGORY_COLORS] }}
        >
          {type[0].toUpperCase()}
        </div>
        <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 md:top-0 bg-card-dark border-b border-card-hover/20 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">saldos</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded-lg transition"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-300 min-w-40 text-center">
              {getMonthName(currentDate)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded-lg transition"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24 md:pb-0">
        <div className="p-4 md:p-6">
          {dailyBalances.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p>Nenhum lançamento neste mês</p>
              <p className="text-sm mt-2">Adicione uma transação para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-hover/20">
                    <th className="text-left py-3 px-2 font-semibold text-gray-400">Dia</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-400">Entradas</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-400">Saídas</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-400">Diários</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-400">Economia</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-400">Cartão</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-400">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyBalances.map((balance) => {
                    const isToday =
                      today.getFullYear() === balance.date.getFullYear() &&
                      today.getMonth() === balance.date.getMonth() &&
                      today.getDate() === balance.date.getDate();

                    const heatmapColor = getHeatmapColor(balance.saldo, today, balance.date);

                    return (
                      <tr
                        key={balance.date.getTime()}
                        className={`border-b border-card-hover/10 transition hover:bg-card-hover/30 ${
                          isToday ? 'bg-card-hover/50' : ''
                        }`}
                      >
                        <td className="py-3 px-2 font-semibold">
                          <span className={isToday ? 'text-entrada' : 'text-white'}>
                            {balance.date.getDate()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          <CategoryCell type="entrada" amount={balance.entrada} />
                        </td>
                        <td className="text-right py-3 px-2">
                          <CategoryCell type="saida" amount={balance.saida} />
                        </td>
                        <td className="text-right py-3 px-2">
                          <CategoryCell type="diario" amount={balance.diario} />
                        </td>
                        <td className="text-right py-3 px-2">
                          <CategoryCell type="economia" amount={balance.economia} />
                        </td>
                        <td className="text-right py-3 px-2">
                          <CategoryCell type="cartao" amount={balance.cartao} />
                        </td>
                        <td
                          className={`text-right py-3 px-2 font-bold rounded ${heatmapColor}`}
                        >
                          <span className="text-white">{formatCurrency(balance.saldo)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-entrada/50 bg-card-hover/20">
                    <td className="py-3 px-2 font-bold text-entrada">Totais</td>
                    <td className="text-right py-3 px-2">
                      <span className="font-bold text-entrada">
                        {formatCurrency(monthlyTotals.entrada)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="font-bold text-saida">
                        {formatCurrency(monthlyTotals.saida)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="font-bold text-diario">
                        {formatCurrency(monthlyTotals.diario)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="font-bold text-economia">
                        {formatCurrency(monthlyTotals.economia)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="font-bold text-cartao">
                        {formatCurrency(monthlyTotals.cartao)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="font-bold text-white">
                        {formatCurrency(monthlyTotals.performance)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
