import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { parseLocalDate } from '../../utils';

interface DatePickerProps {
  /** ISO yyyy-mm-dd string, or '' when empty */
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Formats an ISO yyyy-mm-dd string as dd/mm/aa for display, without using `new Date(isoString)`. */
const isoToDisplay = (iso: string): string => {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year.slice(2)}`;
};

/** Converts a fully-typed dd/mm/aa string into an ISO yyyy-mm-dd string, or null if invalid/incomplete. */
const displayToIso = (display: string): string | null => {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yy] = match;
  const day = Number(dd);
  const month = Number(mm);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const fullYear = 2000 + Number(yy);
  // Validate the date actually exists (e.g. reject 31/02/26)
  const date = parseLocalDate(`${fullYear}-${pad2(month)}-${pad2(day)}`);
  if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${fullYear}-${pad2(month)}-${pad2(day)}`;
};

/** Masks free-typed input into the dd/mm/aa pattern, auto-inserting slashes. */
const maskInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  let result = digits;
  if (digits.length > 4) {
    result = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length > 2) {
    result = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return result;
};

export default function DatePicker({ value, onChange, placeholder = 'dd/mm/aa', className = '', id }: DatePickerProps) {
  const [inputValue, setInputValue] = useState(() => isoToDisplay(value));
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => (value ? parseLocalDate(value) : new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  // Re-sync display state when the `value` prop changes from outside (e.g. parent resets the form).
  // Derived during render (React's recommended pattern) instead of in an effect, to avoid an extra render pass.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(isoToDisplay(value));
    if (value) {
      setViewDate(parseLocalDate(value));
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleInputChange = (raw: string) => {
    const masked = maskInput(raw);
    setInputValue(masked);
    const iso = displayToIso(masked);
    if (iso) {
      onChange(iso);
    }
  };

  const handleDayClick = (day: number) => {
    const iso = `${viewDate.getFullYear()}-${pad2(viewDate.getMonth() + 1)}-${pad2(day)}`;
    onChange(iso);
    setInputValue(isoToDisplay(iso));
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    setViewDate(today);
    onChange(iso);
    setInputValue(isoToDisplay(iso));
    setIsOpen(false);
  };

  const goPrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedIso = value;
  const today = new Date();

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate);

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={
            className ||
            'w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-entrada'
          }
        />
        <button
          type="button"
          aria-label="Abrir calendário"
          onClick={() => setIsOpen((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition p-1"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute z-50 mt-2 w-72 bg-card-dark border border-card-hover/50 rounded-lg shadow-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={goPrevMonth}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-white capitalize">{monthLabel}</span>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={goNextMonth}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-card-hover/50 rounded transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="text-center text-xs text-gray-500 font-medium py-1">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const iso = `${year}-${pad2(month + 1)}-${pad2(day)}`;
                const isSelected = iso === selectedIso;
                const isToday =
                  today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`h-8 w-8 rounded-full text-sm transition flex items-center justify-center mx-auto ${
                      isSelected
                        ? 'bg-entrada text-bg-primary font-bold'
                        : isToday
                          ? 'text-entrada font-semibold hover:bg-card-hover/50'
                          : 'text-gray-300 hover:bg-card-hover/50'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="w-full mt-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-card-hover/50 transition"
            >
              hoje
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
