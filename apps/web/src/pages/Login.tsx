// apps/web/src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Hardcoded credentials check
    const ADMIN_EMAIL = 'tedxgjutickets@gmail.com';
    const ADMIN_PASSWORD = 'Tickets321';

    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      try {
        // Sign in with Supabase (creates session for API calls)
        const { error } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });

        if (error) {
          // If user doesn't exist, create them
          const redirectUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5173/queue'
            : window.location.origin + '/queue';
          
          const { error: signUpError } = await supabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: {
              emailRedirectTo: redirectUrl
            }
          });

          if (signUpError) throw signUpError;

          // Try signing in again
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
          });

          if (retryError) throw retryError;
        }

        // Create a simple session for UI state
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('userEmail', email);
        
        // Trigger a custom event to notify App.tsx
        window.dispatchEvent(new Event('authChange'));
        
        // Navigate to dashboard
        navigate('/queue');
      } catch (error: any) {
        setMessage(error.message || 'Login failed');
        setLoading(false);
      }
    } else {
      setMessage('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <div style={{
        background: '#fff',
        padding: '3rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '0.5rem',
          fontSize: '32px',
          fontWeight: 600
        }}>
          TEDx<span style={{ color: '#e62b1e' }}>GJU</span>
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
          Staff Login
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Tedxgjutickets@gmail.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: message.includes('Check') ? '#d4edda' : '#f8d7da',
            border: `1px solid ${message.includes('Check') ? '#c3e6cb' : '#f5c6cb'}`,
            color: message.includes('Check') ? '#155724' : '#721c24',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
