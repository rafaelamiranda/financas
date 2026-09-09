import { useState } from 'react';
import { useFinancasStore } from '../store';
import { calculateMonthlyTotals, formatCurrency, getMonthName, getDaysInMonth } from '../utils';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types';

export default function Totais() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const transactions = useFinancasStore((state) => state.transactions);

  const monthlyTotals = calculateMonthlyTotals(transactions, currentDate);
  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const daysPassed = Math.min(today.getDate(), daysInMonth);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const diarioMedio = monthlyTotals.diario / daysPassed;
  const isMonthCurrentMonth =
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth();

  const StatCard = ({
    title,
    value,
    color,
    subtitle,
    progressBar,
  }: {
    title: string;
    value: string;
    color: string;
    subtitle?: string;
    progressBar?: number;
  }) => (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">{title}</h3>
      </div>
      <div style={{ color }} className="text-4xl font-bold">
        {value}
      </div>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      {progressBar !== undefined && (
        <div className="w-full bg-card-hover rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(progressBar, 100)}%`,
              backgroundColor: color,
            }}
          />
        </div>
      )}
    </div>
  );

  const MovementItem = ({
    label,
    amount,
    color,
  }: {
    label: string;
    amount: number;
    color: string;
  }) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-card-hover/30 hover:bg-card-hover/50 transition">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: color }}
        >
          {label[0].toUpperCase()}
        </div>
        <span className="font-semibold text-white">{label}</span>
      </div>
      <span className="font-bold text-white">{formatCurrency(amount)}</span>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 md:top-0 bg-card-dark border-b border-card-hover/20 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">totais</h1>
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
        <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
          {/* Cálculos do Mês */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">Cálculos do Mês</h2>

            {/* Grid 2x2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Performance */}
              <StatCard
                title="Performance"
                value={formatCurrency(monthlyTotals.performance)}
                color={monthlyTotals.performance >= 0 ? '#7ED957' : '#FF6B6B'}
                subtitle={
                  monthlyTotals.performance >= 0
                    ? 'Sobrou dinheiro'
                    : 'Faltou dinheiro'
                }
              />

              {/* Economizado */}
              <div className="card space-y-4">
                <h3 className="text-sm font-semibold text-gray-400">Economizado</h3>
                <div className="text-4xl font-bold text-economia">
                  {monthlyTotals.economizedPercentage.toFixed(1)}%
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Guardado</span>
                    <span>Renda</span>
                  </div>
                  <div className="w-full bg-card-hover rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-economia transition-all"
                      style={{
                        width: `${Math.min(monthlyTotals.economizedPercentage, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {monthlyTotals.economizedPercentage === 0
                      ? 'Nada guardado'
                      : `${formatCurrency(monthlyTotals.economia)} guardado`}
                  </p>
                </div>
              </div>

              {/* Custo de Vida */}
              <StatCard
                title="Custo de Vida"
                value={formatCurrency(monthlyTotals.costOfLiving)}
                color="#FF6B6B"
                subtitle={
                  monthlyTotals.costOfLiving <= monthlyTotals.entrada
                    ? 'Dentro da renda'
                    : 'Acima da renda'
                }
              />

              {/* Diário Médio */}
              <div className="card space-y-4">
                <h3 className="text-sm font-semibold text-gray-400">Diário Médio</h3>
                <div className="text-4xl font-bold text-diario">
                  {formatCurrency(diarioMedio)}
                </div>
                <p className="text-xs text-gray-500">
                  {isMonthCurrentMonth
                    ? `Hoje: ${formatCurrency(monthlyTotals.diario / daysPassed)}`
                    : `${daysInMonth} dias`}
                </p>
              </div>
            </div>
          </section>

          {/* Movimentações do Mês */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">Movimentações do Mês</h2>
            <div className="space-y-2">
              <MovementItem
                label={CATEGORY_LABELS.entrada}
                amount={monthlyTotals.entrada}
                color={CATEGORY_COLORS.entrada}
              />
              <MovementItem
                label={CATEGORY_LABELS.saida}
                amount={monthlyTotals.saida}
                color={CATEGORY_COLORS.saida}
              />
              <MovementItem
                label={CATEGORY_LABELS.diario}
                amount={monthlyTotals.diario}
                color={CATEGORY_COLORS.diario}
              />
              <MovementItem
                label={CATEGORY_LABELS.economia}
                amount={monthlyTotals.economia}
                color={CATEGORY_COLORS.economia}
              />
              <MovementItem
                label={CATEGORY_LABELS.cartao}
                amount={monthlyTotals.cartao}
                color={CATEGORY_COLORS.cartao}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
