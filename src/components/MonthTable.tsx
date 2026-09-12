import type { Transaction } from '../types';
import { calculateDailyBalances, calculateMonthlyTotals, formatCurrency, getMonthName, getHeatmapColor } from '../utils';
import { CATEGORY_COLORS } from '../types';

interface MonthTableProps {
  date: Date;
  transactions: Transaction[];
  onSelectDay: (transactions: Transaction[]) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

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

export default function MonthTable({ date, transactions, onSelectDay, onEditTransaction }: MonthTableProps) {
  const dailyBalances = calculateDailyBalances(transactions, date);
  const monthlyTotals = calculateMonthlyTotals(transactions, date);
  const today = new Date();

  return (
    <div className="min-w-[560px] flex-1">
      <h2 className="text-sm font-semibold text-gray-300 capitalize mb-3 text-center">{getMonthName(date)}</h2>

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
                const dayTransactions = transactions.filter((t) => {
                  const tDate = new Date(t.date);
                  return (
                    tDate.getFullYear() === balance.date.getFullYear() &&
                    tDate.getMonth() === balance.date.getMonth() &&
                    tDate.getDate() === balance.date.getDate()
                  );
                });

                return (
                  <tr
                    key={balance.date.getTime()}
                    className={`border-b border-card-hover/10 transition hover:bg-card-hover/30 cursor-pointer ${
                      isToday ? 'bg-card-hover/50' : ''
                    }`}
                    onClick={() => {
                      if (dayTransactions.length === 1) {
                        onEditTransaction(dayTransactions[0]);
                      } else if (dayTransactions.length > 1) {
                        onSelectDay(dayTransactions);
                      }
                    }}
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
                    <td className={`text-right py-3 px-2 font-bold rounded ${heatmapColor}`}>
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
                  <span className="font-bold text-entrada">{formatCurrency(monthlyTotals.entrada)}</span>
                </td>
                <td className="text-right py-3 px-2">
                  <span className="font-bold text-saida">{formatCurrency(monthlyTotals.saida)}</span>
                </td>
                <td className="text-right py-3 px-2">
                  <span className="font-bold text-diario">{formatCurrency(monthlyTotals.diario)}</span>
                </td>
                <td className="text-right py-3 px-2">
                  <span className="font-bold text-economia">{formatCurrency(monthlyTotals.economia)}</span>
                </td>
                <td className="text-right py-3 px-2">
                  <span className="font-bold text-cartao">{formatCurrency(monthlyTotals.cartao)}</span>
                </td>
                <td className="text-right py-3 px-2">
                  <span className="font-bold text-white">{formatCurrency(monthlyTotals.performance)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
