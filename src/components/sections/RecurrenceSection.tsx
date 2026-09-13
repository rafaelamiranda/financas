import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RecurrenceType } from '../../types';
import DatePicker from '../ui/DatePicker';

interface RecurrenceSectionProps {
  recurrence: RecurrenceType;
  onRecurrenceChange: (value: RecurrenceType) => void;
  recurrenceEndDate: string;
  onEndDateChange: (date: string) => void;
  recurrenceMode: 'infinite' | 'count';
  onModeChange: (mode: 'infinite' | 'count') => void;
  recurrenceCount: string;
  onCountChange: (count: string) => void;
  errors?: Record<string, string>;
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'fixed_until', label: 'Até uma data' },
];

export default function RecurrenceSection({
  recurrence,
  onRecurrenceChange,
  recurrenceEndDate,
  onEndDateChange,
  recurrenceMode,
  onModeChange,
  recurrenceCount,
  onCountChange,
  errors = {},
}: RecurrenceSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-400 block mb-2">Recorrência</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white text-left flex items-center justify-between focus:outline-none focus:border-entrada"
          >
            {RECURRENCE_OPTIONS.find((o) => o.value === recurrence)?.label || 'Selecionar'}
            <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-card-dark border border-card-hover/50 rounded-lg shadow-lg overflow-hidden">
              {RECURRENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onRecurrenceChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left transition ${
                    recurrence === option.value
                      ? 'bg-entrada/20 text-entrada'
                      : 'text-gray-300 hover:bg-card-hover/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {recurrence !== 'none' && (
        <>
          {recurrence === 'fixed_until' && (
            <div>
              <label className="text-sm text-gray-400 block mb-2">Data de término</label>
              <DatePicker value={recurrenceEndDate} onChange={onEndDateChange} />
              {errors.recurrenceEndDate && (
                <p className="text-saida text-xs mt-1">{errors.recurrenceEndDate}</p>
              )}
            </div>
          )}

          {recurrence !== 'fixed_until' && (
            <div className="space-y-3">
              <label className="text-sm text-gray-400 block">Quantas vezes?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onModeChange('infinite')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    recurrenceMode === 'infinite'
                      ? 'bg-entrada text-bg-primary'
                      : 'bg-card-hover/50 text-gray-300 hover:text-white'
                  }`}
                >
                  Infinito
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('count')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    recurrenceMode === 'count'
                      ? 'bg-entrada text-bg-primary'
                      : 'bg-card-hover/50 text-gray-300 hover:text-white'
                  }`}
                >
                  Número
                </button>
              </div>

              {recurrenceMode === 'count' && (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={recurrenceCount}
                    onChange={(e) => onCountChange(e.target.value)}
                    placeholder="Ex: 12"
                    className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-entrada"
                  />
                  {errors.recurrenceCount && (
                    <p className="text-saida text-xs mt-1">{errors.recurrenceCount}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
