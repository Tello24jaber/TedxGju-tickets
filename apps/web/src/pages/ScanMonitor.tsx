// apps/web/src/pages/ScanMonitor.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getRedemptions } from '../lib/api';

interface Redemption {
  id: string;
  event_name: string;
  purchaser_name: string;
  seat_tier?: string;
  redeemed_at: string;
  token: string;
}

export default function ScanMonitor() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRedemptions = async () => {
    try {
      setLoading(true);
      const data = await getRedemptions();
      setRedemptions(data);
    } catch (error) {
      console.error('Failed to load redemptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRedemptions();
    const interval = setInterval(loadRedemptions, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Scan Monitor</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Auto-refresh every 10s
          </p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : redemptions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
            No redemptions yet
          </p>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Time</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Event</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Seat</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Token</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>
                      {new Date(r.redeemed_at).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '1rem' }}>{r.purchaser_name}</td>
                    <td style={{ padding: '1rem' }}>{r.event_name}</td>
                    <td style={{ padding: '1rem' }}>{r.seat_tier || '-'}</td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '12px' }}>
                      {r.token}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
