import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChange, getSession } from './lib/auth';
import { useAuthStore } from './store/authStore';
import { fetchTransactions, fetchTags } from './lib/supabase';
import { useFinancasStore } from './store';
import AuthGate from './components/AuthGate';
import Layout from './components/Layout';
import Saldos from './pages/Saldos';
import Totais from './pages/Totais';
import Tags from './pages/Tags';
import Horizonte from './pages/Horizonte';
import Menu from './pages/Menu';

function AppContent() {
  const { setSession, setAuthLoading } = useAuthStore();
  const { transactions } = useFinancasStore();

  useEffect(() => {
    // Initialize auth state from Supabase
    const initAuth = async () => {
      const session = await getSession();
      if (session) {
        setSession(session, session.user);
      } else {
        setAuthLoading(false);
      }
    };

    initAuth();

    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((session, user) => {
      if (session && user) {
        setSession(session, user);
        // Fetch remote data if we just logged in and have no local data
        if (transactions.length === 0) {
          fetchTransactions().then((remoteTransactions) => {
            if (remoteTransactions.length > 0) {
              useFinancasStore.setState({ transactions: remoteTransactions });
            }
          });
          fetchTags().then((remoteTags) => {
            if (remoteTags.length > 0) {
              useFinancasStore.setState({ tags: remoteTags });
            }
          });
        }
      } else {
        useAuthStore.getState().clearSession();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthGate />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Saldos />} />
            <Route path="/totais" element={<Totais />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/horizonte" element={<Horizonte />} />
            <Route path="/settings" element={<Menu />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return <AppContent />;
}

export default App;
