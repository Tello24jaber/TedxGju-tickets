// apps/web/src/pages/Scan.tsx
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { redeemTicket } from '../lib/api';
import type { RedeemResponse } from '../types';

export default function Scan() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<RedeemResponse | null>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [manualToken, setManualToken] = useState('');

  const startScanner = async () => {
    const html5QrCode = new Html5Qrcode('qr-reader');
    setScanner(html5QrCode);

    let isProcessing = false;

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Prevent multiple scans of the same code
          if (isProcessing) return;
          isProcessing = true;

          // Stop scanner immediately
          try {
            await html5QrCode.stop();
          } catch (e) {
            console.error('Error stopping scanner:', e);
          }
          setScanning(false);

          // Extract token from URL
          const match = decodedText.match(/\/r\/([^/?]+)/);
          const token = match ? match[1] : decodedText;
          
          await handleRedeem(token);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      alert('Failed to start camera');
    }
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.stop();
      setScanning(false);
    }
  };

  const handleRedeem = async (token: string) => {
    try {
      const response = await redeemTicket(token);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to validate ticket'
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      handleRedeem(manualToken.trim());
      setManualToken('');
    }
  };

  useEffect(() => {
    return () => {
      if (scanner) scanner.stop();
    };
  }, [scanner]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '32px',
          fontWeight: 600,
          marginBottom: '0.5rem'
        }}>
          TEDx<span style={{ color: '#e62b1e' }}>GJU</span>
        </h1>
        <p style={{ textAlign: 'center', color: '#999', marginBottom: '3rem' }}>
          Ticket Scanner
        </p>

        {!result && (
          <>
            <div id="qr-reader" style={{ marginBottom: '2rem' }}></div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', justifyContent: 'center' }}>
              {!scanning ? (
                <button
                  onClick={startScanner}
                  style={{
                    background: '#e62b1e',
                    color: '#fff',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Start Scanner
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  style={{
                    background: '#666',
                    color: '#fff',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Stop Scanner
                </button>
              )}
            </div>

            <form onSubmit={handleManualSubmit} style={{ marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1rem', color: '#999' }}>Or enter token manually:</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Ticket token..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    borderRadius: '4px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#e62b1e',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Check
                </button>
              </div>
            </form>
          </>
        )}

        {result && (
          <div style={{
            padding: '3rem',
            borderRadius: '8px',
            textAlign: 'center',
            background: result.success ? '#155724' : '#721c24',
            border: `3px solid ${result.success ? '#28a745' : '#e62b1e'}`
          }}>
            <div style={{ fontSize: '64px', marginBottom: '1rem' }}>
              {result.success ? '✓' : '✗'}
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '1rem' }}>
              {result.success ? 'ADMIT' : 'DENIED'}
            </h2>
            <p style={{ fontSize: '18px', marginBottom: '2rem' }}>
              {result.message}
            </p>
            {result.ticket && (
              <div style={{ marginBottom: '2rem', fontSize: '16px' }}>
                <p><strong>{result.ticket.purchaser_name}</strong></p>
                <p>{result.ticket.event_name}</p>
                {result.ticket.seat_tier && <p>Seat: {result.ticket.seat_tier}</p>}
              </div>
            )}
            {result.redeemed_at && (
              <p style={{ fontSize: '14px', color: '#ccc' }}>
                Redeemed: {new Date(result.redeemed_at).toLocaleString()}
              </p>
            )}
            <button
              onClick={() => setResult(null)}
              style={{
                marginTop: '2rem',
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Scan Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
