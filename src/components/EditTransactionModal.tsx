import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Delete, Plus, Check } from 'lucide-react';
import type { Transaction } from '../types';
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

  const { updateTransaction, deleteTransaction, tags, addTag } = useFinancasStore();

  // Initialize state when transaction changes
  if (transaction && (amount === '0' || description === '' || date === '')) {
    setAmount(transaction.amount.toFixed(2));
    setDescription(transaction.description);
    setDate(transaction.date.toISOString().split('T')[0]);
    setSelectedTagIds(transaction.tag_ids);
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
      tag_ids: selectedTagIds,
    });

    onClose();
    setAmount('0');
    setDescription('');
    setDate('');
    setSelectedTagIds([]);
    setShowNewTagForm(false);
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

            <div className="bg-card-hover/50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-2">Valor</p>
              <p
                className="text-5xl font-bold"
                style={{ color: CATEGORY_COLORS[transaction.type] }}
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
