import { useState } from 'react';
import type { Transaction, TransactionType } from '../types';
import {
    calculateDailyBalances,
    calculateMonthlyTotals,
    formatCurrency,
    getMonthName,
    getHeatmapColor,
} from '../utils';
import { CATEGORY_COLORS } from '../types';
import { Plus } from 'lucide-react';

interface MonthTableProps {
    date: Date;
    transactions: Transaction[];
    onSelectDay: (transactions: Transaction[]) => void;
    onEditTransaction: (transaction: Transaction) => void;
    onAddQuickTransaction?: (type: TransactionType, date: Date) => void;
}

const CategoryCell = ({
    type,
    amount,
    onAddClick,
}: {
    type: string;
    amount: number;
    onAddClick?: () => void;
}) => {
    const [showAdd, setShowAdd] = useState(false);

    if (amount === 0) {
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onAddClick?.();
                }}
                className="flex items-center gap-2 relative hover:opacity-80 transition"
                onMouseEnter={() => setShowAdd(true)}
                onMouseLeave={() => setShowAdd(false)}
                title={`Adicionar ${type}`}
            >
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-30 hover:opacity-50 transition"
                    style={{ backgroundColor: CATEGORY_COLORS[type as keyof typeof CATEGORY_COLORS] }}
                >
                    <Plus className="h-3.5 w-3.5" />
                </div>
                <span className="text-gray-600 text-sm">-</span>
            </button>
        );
    }
    return (
        <div
            className="flex items-center gap-2 relative"
            onMouseEnter={() => setShowAdd(true)}
            onMouseLeave={() => setShowAdd(false)}
        >
            <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold relative transition"
                style={{ backgroundColor: CATEGORY_COLORS[type as keyof typeof CATEGORY_COLORS] }}
            >
                <span className={showAdd ? 'opacity-0' : 'opacity-100'}>{type[0].toUpperCase()}</span>
                {showAdd && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddClick?.();
                        }}
                        className="absolute inset-0 flex items-center justify-center hover:scale-110 transition"
                        title="Adicionar transação"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
        </div>
    );
};

export default function MonthTable({
    date,
    transactions,
    onSelectDay,
    onEditTransaction,
    onAddQuickTransaction,
}: MonthTableProps) {
    const dailyBalances = calculateDailyBalances(transactions, date);
    const monthlyTotals = calculateMonthlyTotals(transactions, date);
    const today = new Date();

    return (
        <div className="flex-1">
            <h2 className="text-sm font-semibold text-gray-300 capitalize mb-3 text-center">
                {getMonthName(date)}
            </h2>

            {dailyBalances.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                    <p>Nenhum lançamento neste mês</p>
                    <p className="text-sm mt-2">Adicione uma transação para começar</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-base">
                        <thead>
                            <tr className="border-b border-card-hover/20">
                                <th className="text-left py-3 px-6 font-semibold text-gray-400">
                                    Dia
                                </th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-400">
                                    Entradas
                                </th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-400">
                                    Saídas
                                </th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-400">
                                    Diários
                                </th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-400">
                                    Economia
                                </th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-400">
                                    Cartão
                                </th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-400">
                                    Saldo
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyBalances.map((balance) => {
                                const isToday =
                                    today.getFullYear() === balance.date.getFullYear() &&
                                    today.getMonth() === balance.date.getMonth() &&
                                    today.getDate() === balance.date.getDate();

                                const heatmapColor = getHeatmapColor(balance.saldo);
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
                                        className={`h-12 transition hover:bg-card-hover/10 cursor-pointer ${
                                            isToday
                                                ? 'border-b-2 border-white'
                                                : 'border-b border-card-hover/10'
                                        }`}
                                        onClick={() => {
                                            if (dayTransactions.length === 1) {
                                                onEditTransaction(dayTransactions[0]);
                                            } else if (dayTransactions.length > 1) {
                                                onSelectDay(dayTransactions);
                                            }
                                        }}
                                    >
                                        <td className="py-3 px-6 font-semibold">
                                            <span
                                                className={isToday ? 'text-entrada' : 'text-white'}
                                            >
                                                {balance.date.getDate()}
                                            </span>
                                        </td>
                                        <td className="text-right py-3 px-6">
                                            <CategoryCell
                                                type="entrada"
                                                amount={balance.entrada}
                                                onAddClick={() =>
                                                    onAddQuickTransaction?.('entrada', balance.date)
                                                }
                                            />
                                        </td>
                                        <td className="text-right py-3 px-6">
                                            <CategoryCell
                                                type="saida"
                                                amount={balance.saida}
                                                onAddClick={() =>
                                                    onAddQuickTransaction?.('saida', balance.date)
                                                }
                                            />
                                        </td>
                                        <td className="text-right py-3 px-6">
                                            <CategoryCell
                                                type="diario"
                                                amount={balance.diario}
                                                onAddClick={() =>
                                                    onAddQuickTransaction?.('diario', balance.date)
                                                }
                                            />
                                        </td>
                                        <td className="text-right py-3 px-6">
                                            <CategoryCell
                                                type="economia"
                                                amount={balance.economia}
                                                onAddClick={() =>
                                                    onAddQuickTransaction?.('economia', balance.date)
                                                }
                                            />
                                        </td>
                                        <td className="text-right py-3 px-6">
                                            <CategoryCell
                                                type="cartao"
                                                amount={balance.cartao}
                                                onAddClick={() =>
                                                    onAddQuickTransaction?.('cartao', balance.date)
                                                }
                                            />
                                        </td>
                                        <td
                                            className={`text-right py-3 px-6 font-bold ${heatmapColor.className}`}
                                            style={heatmapColor.style}
                                        >
                                            <span className="text-white">
                                                {formatCurrency(balance.saldo)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {Array.from({ length: 31 - dailyBalances.length }).map((_, i) => (
                                <tr key={`empty-${i}`} className="h-12 border-b border-card-hover/10 hover:bg-card-hover/10">
                                    <td className="py-3 px-6"></td>
                                    <td className="text-right py-3 px-6"></td>
                                    <td className="text-right py-3 px-6"></td>
                                    <td className="text-right py-3 px-6"></td>
                                    <td className="text-right py-3 px-6"></td>
                                    <td className="text-right py-3 px-6"></td>
                                    <td className="text-right py-3 px-6"></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-entrada/50 bg-card-hover/10">
                                <td className="py-3 px-6 font-bold text-entrada">Totais</td>
                                <td className="text-right py-3 px-6">
                                    <span className="font-bold text-entrada">
                                        {formatCurrency(monthlyTotals.entrada)}
                                    </span>
                                </td>
                                <td className="text-right py-3 px-6">
                                    <span className="font-bold text-saida">
                                        {formatCurrency(monthlyTotals.saida)}
                                    </span>
                                </td>
                                <td className="text-right py-3 px-6">
                                    <span className="font-bold text-diario">
                                        {formatCurrency(monthlyTotals.diario)}
                                    </span>
                                </td>
                                <td className="text-right py-3 px-6">
                                    <span className="font-bold text-economia">
                                        {formatCurrency(monthlyTotals.economia)}
                                    </span>
                                </td>
                                <td className="text-right py-3 px-6">
                                    <span className="font-bold text-cartao">
                                        {formatCurrency(monthlyTotals.cartao)}
                                    </span>
                                </td>
                                <td className="text-right py-3 px-6">
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
    );
}
