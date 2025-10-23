// apps/web/src/pages/Reports.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getStats } from '../lib/api';
import type { Stats } from '../types';

export default function Reports() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <Layout><p>Loading...</p></Layout>;
  if (!stats) return <Layout><p>Failed to load stats</p></Layout>;

  const statCards = [
    {
      title: 'Total Requests',
      value: stats.total_requests,
      color: '#000'
    },
    {
      title: 'Pending',
      value: stats.pending_requests,
      color: '#856404'
    },
    {
      title: 'Approved',
      value: stats.approved_requests,
      color: '#155724'
    },
    {
      title: 'Rejected',
      value: stats.rejected_requests,
      color: '#721c24'
    },
    {
      title: 'Total Tickets',
      value: stats.total_tickets,
      color: '#000'
    },
    {
      title: 'Valid',
      value: stats.valid_tickets,
      color: '#155724'
    },
    {
      title: 'Redeemed',
      value: stats.redeemed_tickets,
      color: '#0c5460'
    },
    {
      title: 'Cancelled',
      value: stats.cancelled_tickets,
      color: '#721c24'
    }
  ];

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 600, marginBottom: '2rem' }}>
          Reports
        </h2>

        <div 
          className="responsive-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${card.color}`
              }}
            >
              <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#666',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: 'clamp(28px, 6vw, 36px)',
                fontWeight: 600,
                color: card.color
              }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 600, marginBottom: '1rem' }}>
            Redemption Rate
          </h3>
          {stats.total_tickets > 0 ? (
            <div>
              <div style={{
                background: '#f5f5f5',
                height: '40px',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                <div style={{
                  background: '#e62b1e',
                  height: '100%',
                  width: `${(stats.redeemed_tickets / stats.total_tickets) * 100}%`,
                  transition: 'width 0.3s'
                }}></div>
              </div>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>
                {((stats.redeemed_tickets / stats.total_tickets) * 100).toFixed(1)}%
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {stats.redeemed_tickets} of {stats.total_tickets} tickets redeemed
              </p>
            </div>
          ) : (
            <p style={{ color: '#666' }}>No tickets issued yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
