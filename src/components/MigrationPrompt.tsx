import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFinancasStore } from '../store';
import { insertTransaction, insertTag } from '../lib/supabase';

export default function MigrationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const { user } = useAuthStore();
  const { transactions, tags } = useFinancasStore();

  useEffect(() => {
    const checkMigrationNeeded = async () => {
      if (!user) return;

      const migrationKey = `migration_completed_${user.id}`;
      const alreadyMigrated = localStorage.getItem(migrationKey) === 'true';

      if (alreadyMigrated) {
        setShowPrompt(false);
        return;
      }

      // Show prompt if user has local data
      if (transactions.length > 0 || tags.length > 0) {
        setShowPrompt(true);
      }
    };

    checkMigrationNeeded();
  }, [user]);

  const handleMigrate = async () => {
    if (!user) return;

    setMigrating(true);
    try {
      // Migrate transactions
      for (const transaction of transactions) {
        const { id, created_at, ...rest } = transaction;
        await insertTransaction(rest);
      }

      // Migrate tags
      for (const tag of tags) {
        const { id, ...rest } = tag;
        await insertTag(rest);
      }

      // Mark migration as completed
      localStorage.setItem(`migration_completed_${user.id}`, 'true');
      setShowPrompt(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`migration_completed_${user.id}`, 'true');
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-dark border border-card-hover/50 rounded-lg p-6 max-w-sm w-full">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-entrada flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold text-white">Migrar dados locais?</h2>
            <p className="text-sm text-gray-400 mt-1">
              Você tem {transactions.length} transação{transactions.length !== 1 ? 's' : ''} e{' '}
              {tags.length} tag{tags.length !== 1 ? 's' : ''} no seu navegador.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-6">
          Deseja migrar esses dados para sua conta Supabase? Você poderá acessá-los de qualquer dispositivo.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            disabled={migrating}
            className="flex-1 py-2 px-3 rounded-lg bg-card-hover/50 text-gray-300 hover:text-white transition font-semibold text-sm disabled:opacity-50"
          >
            Agora não
          </button>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="flex-1 py-2 px-3 rounded-lg bg-entrada hover:bg-entrada/90 text-bg-primary font-bold text-sm transition disabled:opacity-50"
          >
            {migrating ? 'Migrando...' : 'Migrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
