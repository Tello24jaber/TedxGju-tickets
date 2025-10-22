// apps/web/src/components/Layout.tsx
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#000',
        color: '#fff',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600 }}>
            TEDx<span style={{ color: '#e62b1e' }}>GJU</span>
          </h1>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/queue" style={{ color: '#fff', textDecoration: 'none' }}>Queue</a>
            <a href="/tickets" style={{ color: '#fff', textDecoration: 'none' }}>Tickets</a>
            <a href="/scan-monitor" style={{ color: '#fff', textDecoration: 'none' }}>Scan Monitor</a>
            <a href="/reports" style={{ color: '#fff', textDecoration: 'none' }}>Reports</a>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid #fff',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '4px'
          }}
        >
          Logout
        </button>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
