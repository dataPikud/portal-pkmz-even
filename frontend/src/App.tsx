import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { NeuralNetworkBackground } from './components/NeuralNetworkBackground';
import { ContactForm } from './components/ContactForm';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { AdminPage } from './pages/AdminPage';
import { ContentPage } from './pages/ContentPage';
import { useAuthStore } from './store/useAuthStore';
import { api } from './lib/api';
import type { User } from './types';

// SSO stub: מגדירים זהות ברירת מחדל לפני כל render
if (!sessionStorage.getItem('employeeId')) {
  sessionStorage.setItem('employeeId', 'admin001');
  sessionStorage.setItem('displayName', 'מנהל מערכת');
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition-container">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/content" element={<ContentPage />} />
      </Routes>
    </div>
  );
}

function AppShell() {
  const { isLoading, setUser } = useAuthStore();

  useEffect(() => {
    void api.users.me()
      .then((user) => {
        setUser(user as User | null);
      })
      .catch(() => {
        setUser(null);
      });
  }, [setUser]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>טוען...</span>
      </div>
    );
  }

  return (
    <div className="app-root">
      <NeuralNetworkBackground />
      <AnimatedRoutes />
      <ContactForm />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
