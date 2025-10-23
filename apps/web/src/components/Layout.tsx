// apps/web/src/components/Layout.tsx
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userEmail');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#000',
        color: '#fff',
        padding: '1rem',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 600, margin: 0 }}>
            TEDx<span style={{ color: '#e62b1e' }}>GJU</span>
          </h1>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: '1px solid #fff',
              color: '#fff',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '20px',
              cursor: 'pointer'
            }}
            className="mobile-menu-btn"
          >
            ☰
          </button>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
            <nav style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <a href="/queue" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Queue</a>
              <a href="/tickets" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Tickets</a>
              <a href="/scan" style={{ color: '#e62b1e', textDecoration: 'none', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap' }}>📱 Scan</a>
              <a href="/scan-monitor" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Monitor</a>
              <a href="/reports" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap' }}>Reports</a>
            </nav>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #fff',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div 
            className="mobile-menu"
            style={{
              display: 'none',
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#111',
              padding: '1rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              zIndex: 1000
            }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="/queue" style={{ color: '#fff', textDecoration: 'none', padding: '0.5rem' }}>Queue</a>
              <a href="/tickets" style={{ color: '#fff', textDecoration: 'none', padding: '0.5rem' }}>Tickets</a>
              <a href="/scan" style={{ color: '#e62b1e', textDecoration: 'none', fontWeight: 600, padding: '0.5rem' }}>📱 Scan</a>
              <a href="/scan-monitor" style={{ color: '#fff', textDecoration: 'none', padding: '0.5rem' }}>Scan Monitor</a>
              <a href="/reports" style={{ color: '#fff', textDecoration: 'none', padding: '0.5rem' }}>Reports</a>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #fff',
                  color: '#fff',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                  textAlign: 'left'
                }}
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>
      <main style={{ flex: 1, padding: 'clamp(1rem, 3vw, 2rem)' }}>
        {children}
      </main>
      
      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
