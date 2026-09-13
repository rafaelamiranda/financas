import { useState, useEffect } from 'react';
import { Wallet, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a recovery token in the URL
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      setError('Link inválido ou expirado. Solicite um novo reset de senha.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!supabase) {
      setError('Supabase não configurado. Verifique .env.local');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-full max-w-sm px-4 text-center">
          <CheckCircle className="h-16 w-16 text-entrada mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Senha Redefinida!</h1>
          <p className="text-gray-400 mb-4">Você será redirecionado em alguns segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-bg-primary overflow-hidden">
      <div className="w-full max-w-sm px-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Wallet className="h-8 w-8 text-entrada" />
          <h1 className="text-3xl font-bold text-white">Definir Nova Senha</h1>
          <p className="text-sm text-gray-400 text-center">
            Crie uma senha forte para sua conta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              minLength={6}
              className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-entrada disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              minLength={6}
              className="w-full bg-card-hover border border-card-hover/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-entrada disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/50">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-bold text-bg-primary bg-entrada hover:bg-entrada/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Atualizando...' : 'Definir Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
