import { useState, useEffect } from 'react';
import { Moon, Sun, Download, Trash2, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../lib/auth';
import { useAuthStore } from '../store/authStore';
import { useFinancasStore } from '../store';

const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  try {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  } catch {
    return 'system';
  }
};

const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

export default function Menu() {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(getInitialTheme);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { clearSession } = useAuthStore();

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const transactions = useFinancasStore((state) => state.transactions);
  const tags = useFinancasStore((state) => state.tags);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch {
      // ignore localStorage errors
    }
    applyTheme(newTheme);
  };

  const handleExportData = () => {
    const data = {
      transactions,
      tags,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      useFinancasStore.setState({ transactions: [], tags: [] });
      try {
        localStorage.removeItem('financas_data');
      } catch {
        // ignore
      }
      setShowClearConfirm(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
      } else {
        clearSession();
        useFinancasStore.setState({ transactions: [], tags: [] });
        navigate('/');
      }
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-card-dark border-b border-card-hover/20 p-4 md:p-6">
        <h1 className="text-2xl font-bold text-white">configurações</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24 md:pb-0">
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
          {/* Theme Section */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Tema
            </h2>
            <div className="space-y-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`w-full text-left py-3 px-4 rounded-lg transition ${
                    theme === t
                      ? 'bg-entrada/30 border border-entrada text-white'
                      : 'bg-card-hover/30 border border-card-hover/50 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {t === 'light' && <Sun className="h-4 w-4" />}
                    {t === 'dark' && <Moon className="h-4 w-4" />}
                    {t === 'system' && <span className="h-4 w-4 text-center">⚙</span>}
                    <span className="capitalize">{t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Sistema'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Data Section */}
          <div className="border-t border-card-hover/20 pt-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Dados
            </h2>
            <div className="space-y-2">
              <button
                onClick={handleExportData}
                className="w-full py-3 px-4 rounded-lg bg-card-hover/30 border border-card-hover/50 text-gray-300 hover:text-white hover:border-gray-400 transition text-left font-semibold"
              >
                Exportar dados (JSON)
              </button>
              <div className="text-sm text-gray-500 ml-2">
                {transactions.length} transação{transactions.length !== 1 ? 's' : ''} • {tags.length} tag{tags.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-card-hover/20 pt-6">
            <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Zona de Risco
            </h2>
            <button
              onClick={() => setShowClearConfirm(!showClearConfirm)}
              className="w-full py-3 px-4 rounded-lg bg-red-900/20 border border-red-900/50 text-red-400 hover:text-red-300 hover:border-red-900 hover:bg-red-900/30 transition font-semibold text-left"
            >
              Deletar todos os dados
            </button>
            {showClearConfirm && (
              <div className="mt-3 p-3 rounded-lg bg-red-900/20 border border-red-900/50 space-y-2">
                <p className="text-sm text-red-300">
                  Tem certeza? Essa ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-2 px-3 rounded-lg bg-card-hover/50 text-gray-300 hover:text-white transition font-semibold text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleClearData}
                    className="flex-1 py-2 px-3 rounded-lg bg-red-900/50 text-red-300 hover:text-red-200 transition font-bold text-sm"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="border-t border-card-hover/20 pt-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sobre
            </h2>
            <div className="bg-card-hover/30 border border-card-hover/50 rounded-lg p-4 space-y-2">
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-white">Finanças v1.0</p>
                <p className="text-xs text-gray-500 mt-1">Gerenciador de transações pessoal</p>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="border-t border-card-hover/20 pt-6">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-3 px-4 rounded-lg bg-card-hover/30 border border-card-hover/50 text-gray-300 hover:text-white hover:border-gray-400 transition text-left font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-5 w-5" />
              {loggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
