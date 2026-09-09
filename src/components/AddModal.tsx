import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ShoppingBag, PiggyBank, CreditCard, X, ChevronLeft, Plus, Check } from 'lucide-react';
import type { TransactionType, RecurrenceType } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, TAG_COLOR_PRESETS } from '../types';
import { useFinancasStore } from '../store';
import { formatCurrency, parseLocalDate } from '../utils';

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
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PRESETS[0]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const { addTransaction, tags, addTag } = useFinancasStore();

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    addTag({ name, color: newTagColor });
    const created = useFinancasStore.getState().tags.at(-1);
    if (created) {
      setSelectedTagIds((prev) => [...prev, created.id]);
    }
    setNewTagName('');
    setNewTagColor(TAG_COLOR_PRESETS[0]);
    setShowNewTagForm(false);
  };

  const handleSelectType = (type: TransactionType) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setAmount(cleaned || '0');
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    const selectedDate = parseLocalDate(date);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (numAmount <= 0) {
      alert('Valor deve ser maior que 0');
      return;
    }

    if (numAmount > 999999.99) {
      alert('Valor não pode ser maior que R$ 999.999,99');
      return;
    }

    if (selectedDate < oneYearAgo || selectedDate > oneYearFromNow) {
      alert('Data deve estar dentro de 1 ano no passado ou futuro');
      return;
    }

    addTransaction({
      type: selectedType,
      amount: numAmount,
      description: description || CATEGORY_LABELS[selectedType],
      date: selectedDate,
      recurrence,
      recurrence_end_date: recurrence === 'fixed_until' && recurrenceEndDate ? parseLocalDate(recurrenceEndDate) : undefined,
      tag_ids: selectedTagIds,
    });
    onClose();
    setAmount('0');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedTagIds([]);
    setShowNewTagForm(false);
    setRecurrence('none');
    setRecurrenceEndDate('');
    setStep('select');
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

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Valor</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-3 text-white text-lg font-semibold placeholder-gray-500 focus:outline-none focus:border-entrada"
                  />
                  <div className="mt-2 text-center text-sm text-gray-400">
                    {formatCurrency(parseFloat(amount) || 0)}
                  </div>
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

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Tags (opcional)</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const selected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition"
                          style={
                            selected
                              ? { backgroundColor: tag.color + '30', borderColor: tag.color, color: tag.color }
                              : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.15)', color: '#9ca3af' }
                          }
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                          {tag.name}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setShowNewTagForm((v) => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-gray-500 text-gray-400 hover:text-white hover:border-gray-300 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      nova tag
                    </button>
                  </div>

                  {showNewTagForm && (
                    <div className="mt-3 p-3 rounded-lg bg-card-hover/50 space-y-3">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Nome da tag"
                        autoFocus
                        className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-entrada"
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        {TAG_COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTagColor(color)}
                            className="w-7 h-7 rounded-full transition"
                            style={{
                              backgroundColor: color,
                              outline: newTagColor === color ? '2px solid white' : 'none',
                              outlineOffset: '2px',
                            }}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateTag}
                        disabled={!newTagName.trim()}
                        className="w-full py-2 rounded-lg text-sm font-bold text-bg-primary bg-entrada hover:bg-entrada/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Criar e selecionar
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Recorrência</label>
                  <select
                    value={recurrence}
                    onChange={(e) => {
                      const value = e.target.value as RecurrenceType;
                      setRecurrence(value);
                      if (value !== 'fixed_until') {
                        setRecurrenceEndDate('');
                      }
                    }}
                    className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-entrada"
                  >
                    <option value="none">Nenhuma (lançamento único)</option>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="fixed_until">Até uma data</option>
                  </select>

                  {recurrence === 'fixed_until' && (
                    <div className="mt-3">
                      <label className="text-sm text-gray-400 block mb-2">Até quando?</label>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-entrada"
                      />
                    </div>
                  )}
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
