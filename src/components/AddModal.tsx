import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ShoppingBag, PiggyBank, CreditCard, X, ChevronLeft, Delete } from 'lucide-react';
import type { TransactionType } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types';
import { useFinancasStore } from '../store';
import { formatCurrency } from '../utils';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRANSACTION_TYPES: TransactionType[] = ['entrada', 'saida', 'diario', 'economia', 'cartao'];

const CATEGORY_DESCRIPTIONS: Record<TransactionType, string> = {
  entrada: 'salário, comissão, vales',
  saida: 'gastos fixos, boletos, aluguel',
  diario: 'gastos variáveis, compras',
  economia: 'reserva, investimento',
  cartao: 'gastos ou total da fatura',
};

const CATEGORY_ICONS: Record<TransactionType, React.ReactNode> = {
  entrada: <ArrowDownLeft className="h-5 w-5" />,
  saida: <ArrowUpRight className="h-5 w-5" />,
  diario: <ShoppingBag className="h-5 w-5" />,
  economia: <PiggyBank className="h-5 w-5" />,
  cartao: <CreditCard className="h-5 w-5" />,
};

export default function AddModal({ isOpen, onClose }: AddModalProps) {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedType, setSelectedType] = useState<TransactionType>('entrada');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { addTransaction } = useFinancasStore();

  const handleSelectType = (type: TransactionType) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleAddAmount = (digit: string) => {
    if (digit === 'backspace') {
      setAmount(amount.slice(0, -1) || '0');
    } else {
      setAmount(amount === '0' ? digit : amount + digit);
    }
  };

  const handleAddDecimal = () => {
    if (!amount.includes('.')) {
      setAmount(amount + '.');
    }
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      addTransaction({
        type: selectedType,
        amount: numAmount,
        description: description || CATEGORY_LABELS[selectedType],
        date: new Date(date),
        recurrence: 'none',
        tag_ids: [],
      });
      onClose();
      setAmount('0');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setStep('select');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:w-96 bg-card-dark rounded-t-2xl md:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {step === 'select' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-6">Selecione o tipo</h2>
                <div className="space-y-3">
                  {TRANSACTION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectType(type)}
                      className="w-full p-4 rounded-lg bg-card-hover/50 hover:bg-card-hover transition text-left border-l-4"
                      style={{ borderColor: CATEGORY_COLORS[type] }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[type] }}
                        >
                          {CATEGORY_ICONS[type]}
                        </div>
                        <div>
                          <h3 className="font-bold text-white capitalize">{CATEGORY_LABELS[type]}</h3>
                          <p className="text-sm text-gray-400">{CATEGORY_DESCRIPTIONS[type]}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setStep('select')}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>

                <h2 className="text-xl font-bold text-white">
                  Adicionar {CATEGORY_LABELS[selectedType]}
                </h2>

                <div className="bg-card-hover/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400 mb-2">Valor</p>
                  <p
                    className="text-5xl font-bold"
                    style={{ color: CATEGORY_COLORS[selectedType] }}
                  >
                    {formatCurrency(parseFloat(amount) || 0)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleAddAmount(num.toString())}
                      className="py-3 bg-card-hover hover:bg-card-hover/80 rounded-lg font-bold text-white transition"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleAddDecimal}
                    className="py-3 bg-card-hover hover:bg-card-hover/80 rounded-lg font-bold text-white transition"
                  >
                    ,
                  </button>
                  <button
                    onClick={() => handleAddAmount('0')}
                    className="py-3 bg-card-hover hover:bg-card-hover/80 rounded-lg font-bold text-white transition col-span-2"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleAddAmount('backspace')}
                    className="py-3 bg-red-900/30 hover:bg-red-900/50 rounded-lg font-bold text-red-400 transition flex items-center justify-center"
                  >
                    <Delete className="h-5 w-5" />
                  </button>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={CATEGORY_LABELS[selectedType]}
                    className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-entrada"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-entrada"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={parseFloat(amount) <= 0}
                  style={{ backgroundColor: CATEGORY_COLORS[selectedType] }}
                  className="w-full py-3 rounded-full font-bold text-bg-primary hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar {CATEGORY_LABELS[selectedType]}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
