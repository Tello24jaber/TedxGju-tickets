import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Queue from './pages/Queue';
import RequestDetail from './pages/RequestDetail';
import Tickets from './pages/Tickets';
import ScanMonitor from './pages/ScanMonitor';
import Reports from './pages/Reports';
import Scan from './pages/Scan';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/scan" element={<Scan />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        {session ? (
          <>
            <Route path="/" element={<Navigate to="/queue" replace />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/scan-monitor" element={<ScanMonitor />} />
            <Route path="/reports" element={<Reports />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
