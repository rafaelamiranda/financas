import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Login from '../pages/Login';

export default function AuthGate() {
  const { session, authLoading } = useAuthStore();

  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-card-hover/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-entrada animate-spin"></div>
          </div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <Outlet />;
}
