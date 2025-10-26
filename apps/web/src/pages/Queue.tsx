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
    } catch (error: any) {
      console.error('Sync error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Sync failed';
      alert(`Sync failed: ${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [search]);

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 600, margin: 0 }}>Approval Queue</h2>
          <Button onClick={handleSync} disabled={syncing} style={{ whiteSpace: 'nowrap' }}>
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
          <div className="table-container" style={{ overflow: 'auto', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: '1100px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Event</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>Qty</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Payment</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Student ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Transport</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Submitted</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>{req.name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px', wordBreak: 'break-word' }}>{req.email}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>{req.event_name}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '14px' }}>{req.qty}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>{req.payment_type || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>{req.student_id || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>{req.needs_transportation || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <Button
                        onClick={() => navigate(`/requests/${req.id}`)}
                        variant="secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '13px', whiteSpace: 'nowrap' }}
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
