import { useState } from 'react';
import { Wallet, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase não configurado. Verifique .env.local');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage('✅ Email enviado! Procure na caixa de entrada (ou spam)');
        setSubmitted(true);
        setEmail('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-bg-primary overflow-hidden">
      <div className="w-full max-w-sm px-4">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-entrada hover:text-entrada/90 mb-6 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="flex flex-col items-center gap-3 mb-8">
          <Wallet className="h-8 w-8 text-entrada" />
          <h1 className="text-3xl font-bold text-white">Recuperar Senha</h1>
          <p className="text-sm text-gray-400 text-center">
            Digite seu email para receber instruções
          </p>
        </div>

        {/* Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                required
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
              {loading ? 'Enviando...' : 'Enviar Instruções'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-900/20 border border-green-900/50">
              <p className="text-sm text-green-400">{message}</p>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p>📧 Procure um email de Supabase com o assunto "Reset Password"</p>
              <p>Clique no link para definir uma nova senha</p>
              <p>Depois volte aqui e faça login com sua nova senha</p>
            </div>
            <button
              onClick={onBack}
              className="w-full py-3 px-4 rounded-lg font-bold text-white bg-card-hover hover:bg-card-hover/80 transition"
            >
              Voltar para Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
