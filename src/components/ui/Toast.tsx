import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export default function Toast() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed top-4 right-4 z-100 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="alert"
            className={`flex items-start gap-2 p-3 rounded-lg shadow-lg border text-sm ${
              toast.type === 'error'
                ? 'bg-red-900/90 border-red-900/50 text-red-100'
                : 'bg-card-hover border-card-hover/50 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Fechar notificação"
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
