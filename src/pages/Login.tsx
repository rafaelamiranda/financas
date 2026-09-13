import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { signUp, signIn } from '../lib/auth';
import { useAuthStore } from '../store/authStore';
import ForgotPassword from './ForgotPassword';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession, authError, setAuthError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setAuthError('As senhas não coincidem');
          setLoading(false);
          return;
        }

        const { user, error } = await signUp(email, password);
        if (error) {
          setAuthError(error);
        } else if (user) {
          // After sign up, automatically sign in
          const { session, error: signInError } = await signIn(email, password);
          if (signInError) {
            setAuthError('Registrado! Faça login para continuar.');
          } else if (session) {
            setSession(session, user);
          }
        }
      } else {
        const { session, error } = await signIn(email, password);
        if (error) {
          setAuthError(error);
        } else if (session) {
          setSession(session, session.user);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-bg-primary overflow-hidden">
      <div className="w-full max-w-sm px-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Wallet className="h-8 w-8 text-entrada" />
          <h1 className="text-3xl font-bold text-white">financas</h1>
          <p className="text-sm text-gray-400 text-center">
            {isSignUp ? 'Crie uma conta para começar' : 'Bem-vindo de volta'}
          </p>
        </div>

        {/* Form */}
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Senha</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={loading}
                  className="text-xs text-entrada hover:text-entrada/90 disabled:opacity-50"
                >
                  Esqueceu?
                </button>
              )}
            </div>
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

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
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
          )}

          {/* Error Message */}
          {authError && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/50">
              <p className="text-sm text-red-400">{authError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-bold text-bg-primary bg-entrada hover:bg-entrada/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Registrar' : 'Entrar'}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={loading}
              className="ml-2 text-entrada hover:text-entrada/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignUp ? 'Entrar' : 'Registrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
