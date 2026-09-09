import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import type { Transaction, RecurrenceType } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, TAG_COLOR_PRESETS } from '../types';
import { useFinancasStore } from '../store';
import { formatCurrency, parseLocalDate } from '../utils';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export default function EditTransactionModal({ isOpen, transaction, onClose }: EditTransactionModalProps) {
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PRESETS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const { updateTransaction, deleteTransaction, tags, addTag } = useFinancasStore();

  // Initialize state when transaction changes
  if (transaction && (amount === '0' || description === '' || date === '')) {
    setAmount(transaction.amount.toFixed(2));
    setDescription(transaction.description);
    setDate(transaction.date.toISOString().split('T')[0]);
    setSelectedTagIds(transaction.tag_ids);
    setRecurrence(transaction.recurrence);
    setRecurrenceEndDate(transaction.recurrence_end_date ? transaction.recurrence_end_date.toISOString().split('T')[0] : '');
  }

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

  const handleSave = () => {
    if (!transaction) return;

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

    updateTransaction(transaction.id, {
      amount: numAmount,
      description: description || CATEGORY_LABELS[transaction.type],
      date: selectedDate,
      recurrence,
      recurrence_end_date: recurrence === 'fixed_until' && recurrenceEndDate ? parseLocalDate(recurrenceEndDate) : undefined,
      tag_ids: selectedTagIds,
    });

    onClose();
    setAmount('0');
    setDescription('');
    setDate('');
    setSelectedTagIds([]);
    setShowNewTagForm(false);
    setRecurrence('none');
    setRecurrenceEndDate('');
  };

  const handleDelete = () => {
    if (transaction && showDeleteConfirm) {
      deleteTransaction(transaction.id);
      onClose();
      setShowDeleteConfirm(false);
      setAmount('0');
      setDescription('');
      setDate('');
      setSelectedTagIds([]);
    }
  };

  if (!transaction) return null;

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

            <h2 className="text-xl font-bold text-white">
              Editar {CATEGORY_LABELS[transaction.type]}
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
              <label className="text-sm text-gray-400 block mb-2">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={CATEGORY_LABELS[transaction.type]}
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
              <label className="text-sm text-gray-400 block mb-2">Tags</label>
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
              <label className="text-sm text-gray-400 block mb-3">Recorrência</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecurrence('none');
                    setRecurrenceEndDate('');
                  }}
                  className={`w-full text-left py-2 px-3 rounded-lg transition ${
                    recurrence === 'none'
                      ? 'bg-entrada/30 border border-entrada text-white'
                      : 'bg-card-hover/30 border border-card-hover/50 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  Nenhuma (lançamento único)
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrence('daily')}
                  className={`w-full text-left py-2 px-3 rounded-lg transition ${
                    recurrence === 'daily'
                      ? 'bg-entrada/30 border border-entrada text-white'
                      : 'bg-card-hover/30 border border-card-hover/50 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  Diário
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrence('weekly')}
                  className={`w-full text-left py-2 px-3 rounded-lg transition ${
                    recurrence === 'weekly'
                      ? 'bg-entrada/30 border border-entrada text-white'
                      : 'bg-card-hover/30 border border-card-hover/50 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  Semanal
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrence('monthly')}
                  className={`w-full text-left py-2 px-3 rounded-lg transition ${
                    recurrence === 'monthly'
                      ? 'bg-entrada/30 border border-entrada text-white'
                      : 'bg-card-hover/30 border border-card-hover/50 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrence('fixed_until')}
                  className={`w-full text-left py-2 px-3 rounded-lg transition ${
                    recurrence === 'fixed_until'
                      ? 'bg-entrada/30 border border-entrada text-white'
                      : 'bg-card-hover/30 border border-card-hover/50 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  Até uma data
                </button>
              </div>

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

            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-card-hover/50 transition font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm) {
                    handleDelete();
                  } else {
                    setShowDeleteConfirm(true);
                  }
                }}
                className="px-3 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition font-bold"
              >
                {showDeleteConfirm ? 'Confirmar' : 'Deletar'}
              </button>
              <button
                onClick={handleSave}
                disabled={parseFloat(amount) <= 0}
                style={{ backgroundColor: CATEGORY_COLORS[transaction.type] }}
                className="flex-1 py-2 rounded-lg font-bold text-bg-primary hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
