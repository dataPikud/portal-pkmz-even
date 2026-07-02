import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ContactForm } from './components/ContactForm';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { AdminPage } from './pages/AdminPage';
import { useAuthStore } from './store/useAuthStore';
import { api } from './lib/api';
import type { User } from './types';

// SSO stub: מגדירים זהות ברירת מחדל לפני כל render
// כשיהיה SSO אמיתי יוחלף בטוקן מה-IdP
if (!sessionStorage.getItem('employeeId')) {
  sessionStorage.setItem('employeeId', 'admin001');
  sessionStorage.setItem('displayName', 'מנהל מערכת');
}

function AppShell() {
  const { isLoading, setUser } = useAuthStore();

  useEffect(() => {
    void api.users.me()
      .then((user) => {
        // user יכול להיות null אם אין SSO - זה תקין
        setUser(user as User | null);
      })
      .catch(() => {
        // fallback אם ה-backend לא פועל בכלל
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
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
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
