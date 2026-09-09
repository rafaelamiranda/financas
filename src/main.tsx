import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme before rendering
const applySavedTheme = () => {
  try {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const theme = savedTheme || 'system';

    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch {
    // ignore
  }
};

applySavedTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
