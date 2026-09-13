import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import type { Transaction, RecurrenceType } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, TAG_COLOR_PRESETS } from '../types';
import { useFinancasStore } from '../store';
import { formatCurrency, parseLocalDate, validateTransactionAmount, validateTransactionDate, validateRecurrenceCount, validateRecurrenceEndDate } from '../utils';
import { useFocusTrap } from '../hooks/useFocusTrap';
import DatePicker from './ui/DatePicker';

const DESCRIPTION_MAX_LENGTH = 120;

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  isRecurringInstance?: boolean;
}

export default function EditTransactionModal({
  isOpen,
  transaction,
  onClose,
  isRecurringInstance = false,
}: EditTransactionModalProps) {
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
  const [recurrenceMode, setRecurrenceMode] = useState<'infinite' | 'count'>('infinite');
  const [recurrenceCount, setRecurrenceCount] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showRecurrenceChoice, setShowRecurrenceChoice] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);

  const { updateTransaction, deleteTransaction, tags, addTag } = useFinancasStore();
  const sortedTags = [...tags].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen, onClose);

  // Initialize state when transaction changes
  if (transaction && (amount === '0' || description === '' || date === '')) {
    setAmount(transaction.amount.toFixed(2));
    setDescription(transaction.description);
    setDate(transaction.date.toISOString().split('T')[0]);
    setSelectedTagIds(transaction.tag_ids);
    setRecurrence(transaction.recurrence);
    setRecurrenceEndDate(transaction.recurrence_end_date ? transaction.recurrence_end_date.toISOString().split('T')[0] : '');
    setRecurrenceMode(transaction.recurrence_count ? 'count' : 'infinite');
    setRecurrenceCount(transaction.recurrence_count ? transaction.recurrence_count.toString() : '');
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
    const errors: Record<string, string> = {};

    // Validar data
    if (!date) {
      errors.date = 'Data é obrigatória';
    } else {
      const selectedDate = parseLocalDate(date);
      const dateValidation = validateTransactionDate(selectedDate);
      if (!dateValidation.valid) {
        errors.date = dateValidation.error || 'Data inválida';
      }
    }

    // Validar valor
    if (!amount) {
      errors.amount = 'Valor é obrigatório';
    } else {
      const amountValidation = validateTransactionAmount(numAmount);
      if (!amountValidation.valid) {
        errors.amount = amountValidation.error || 'Valor inválido';
      }
    }

    // Validar recurrence_end_date se necessário
    if (recurrence === 'fixed_until') {
      if (!recurrenceEndDate) {
        errors.recurrenceEndDate = 'Data de término é obrigatória para recorrência "Até uma data"';
      } else {
        const selectedDate = parseLocalDate(date);
        const recurrenceEndDateParsed = parseLocalDate(recurrenceEndDate);
        const endDateValidation = validateRecurrenceEndDate(selectedDate, recurrenceEndDateParsed);
        if (!endDateValidation.valid) {
          errors.recurrenceEndDate = endDateValidation.error || 'Data inválida';
        }
      }
    }

    // Validar recurrence_count se necessário
    if (recurrence !== 'none' && recurrenceMode === 'count') {
      const countValidation = validateRecurrenceCount(recurrenceCount, recurrenceMode);
      if (!countValidation.valid) {
        errors.recurrenceCount = countValidation.error || 'Número inválido';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const selectedDate = parseLocalDate(date);
    const recurrenceCountValue = recurrence !== 'none' && recurrenceMode === 'count' ? parseInt(recurrenceCount, 10) : undefined;

    const changes = {
      amount: numAmount,
      description: description || CATEGORY_LABELS[transaction.type],
      date: selectedDate,
      recurrence,
      recurrence_end_date: recurrence === 'fixed_until' && recurrenceEndDate ? parseLocalDate(recurrenceEndDate) : undefined,
      recurrence_count: recurrenceCountValue,
      tag_ids: selectedTagIds,
    };

    // Se é uma instância recorrente, perguntar se edita apenas essa ou todas a partir dela
    if (isRecurringInstance && (transaction.recurrence !== 'none' || transaction.recurrence)) {
      setPendingChanges(changes);
      setShowRecurrenceChoice(true);
    } else {
      applyChanges(changes, 'all');
    }
  };

  const applyChanges = (changes: any, scope: 'this' | 'all') => {
    if (!transaction) return;

    if (scope === 'this') {
      // Criar um novo registro sem recorrência com as mudanças
      updateTransaction(transaction.id, {
        ...changes,
        recurrence: 'none',
        recurrence_end_date: undefined,
      });
    } else {
      // Atualizar o registro original com recorrência
      updateTransaction(transaction.id, changes);
    }

    onClose();
    setAmount('0');
    setDescription('');
    setDate('');
    setSelectedTagIds([]);
    setShowNewTagForm(false);
    setRecurrence('none');
    setRecurrenceEndDate('');
    setRecurrenceMode('infinite');
    setRecurrenceCount('');
    setShowRecurrenceChoice(false);
    setPendingChanges(null);
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
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Editar ${CATEGORY_LABELS[transaction.type]}`}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:w-96 bg-card-dark rounded-t-2xl md:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              aria-label="Fechar"
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
              {fieldErrors.amount && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.amount}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Descrição</label>
                <span className="text-xs text-gray-500">
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
                maxLength={DESCRIPTION_MAX_LENGTH}
                placeholder={CATEGORY_LABELS[transaction.type]}
                className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-entrada"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Data</label>
              <DatePicker value={date} onChange={setDate} />
              {fieldErrors.date && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.date}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {sortedTags.map((tag) => {
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

              {recurrence !== 'none' && (
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 block">Quantas transações?</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRecurrenceMode('infinite')}
                        className={`flex-1 py-2 rounded-lg transition font-medium ${
                          recurrenceMode === 'infinite'
                            ? 'bg-entrada text-bg-primary'
                            : 'bg-card-hover text-gray-400 hover:text-white'
                        }`}
                      >
                        Infinito
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecurrenceMode('count')}
                        className={`flex-1 py-2 rounded-lg transition font-medium ${
                          recurrenceMode === 'count'
                            ? 'bg-entrada text-bg-primary'
                            : 'bg-card-hover text-gray-400 hover:text-white'
                        }`}
                      >
                        Número
                      </button>
                    </div>
                  </div>

                  {recurrenceMode === 'count' && (
                    <input
                      type="number"
                      value={recurrenceCount}
                      onChange={(e) => setRecurrenceCount(e.target.value)}
                      placeholder="Ex: 10"
                      min="2"
                      className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-entrada"
                    />
                  )}

                  {recurrence === 'fixed_until' && (
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Até quando?</label>
                      <DatePicker value={recurrenceEndDate} onChange={setRecurrenceEndDate} />
                    </div>
                  )}
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

            {showRecurrenceChoice && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-card-dark rounded-lg p-6 max-w-sm mx-4 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-bold text-white">Editar recorrência</h3>
                  <p className="text-gray-400">Como deseja editar esta transação?</p>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        pendingChanges && applyChanges(pendingChanges, 'this')
                      }
                      className="w-full py-3 rounded-lg bg-card-hover hover:bg-card-hover/80 text-white transition text-sm font-medium text-left"
                    >
                      Apenas esta ocorrência
                    </button>
                    <button
                      onClick={() =>
                        pendingChanges && applyChanges(pendingChanges, 'all')
                      }
                      style={{ backgroundColor: CATEGORY_COLORS[transaction.type] }}
                      className="w-full py-3 rounded-lg text-bg-primary hover:opacity-90 transition text-sm font-medium"
                    >
                      Esta e todas as futuras
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
