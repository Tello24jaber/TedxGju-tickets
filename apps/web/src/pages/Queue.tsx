// apps/web/src/pages/Queue.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { getRequests, syncGoogleSheets } from '../lib/api';
import type { PurchaseRequest } from '../types';

export default function Queue() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getRequests('pending_review', search);
      setRequests(data.data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncGoogleSheets();
      await loadRequests();
      alert('Sync completed!');
    } catch (error) {
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [search]);

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Approval Queue</h2>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Google Sheets'}
          </Button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
            No pending requests
          </p>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Event</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Seat</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Submitted</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>{req.name}</td>
                    <td style={{ padding: '1rem' }}>{req.email}</td>
                    <td style={{ padding: '1rem' }}>{req.event_name}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{req.qty}</td>
                    <td style={{ padding: '1rem' }}>{req.seat_tier || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <Button
                        onClick={() => navigate(`/requests/${req.id}`)}
                        variant="secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '13px' }}
                      >
                        Review
                      </Button>
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
