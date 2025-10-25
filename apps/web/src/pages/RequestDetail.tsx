// apps/web/src/pages/RequestDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { getRequest, approveRequest, rejectRequest } from '../lib/api';
import type { PurchaseRequest } from '../types';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const load = async () => {
      try {
        const data = await getRequest(id);
        setRequest(data);
      } catch (error) {
        console.error('Failed to load request:', error);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [id]);

  const handleApprove = async () => {
    if (!request || !window.confirm(`Approve and issue ${request.qty} ticket(s)?`)) return;
    
    try {
      setProcessing(true);
      await approveRequest(request.id);
      alert('Request approved! Tickets sent.');
      navigate('/queue');
    } catch (error) {
      alert('Approval failed');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!request || !reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    if (!window.confirm('Reject this request?')) return;
    
    try {
      setProcessing(true);
      await rejectRequest(request.id, reason);
      alert('Request rejected');
      navigate('/queue');
    } catch (error) {
      alert('Rejection failed');
      setProcessing(false);
    }
  };

  if (loading) return <Layout><p>Loading...</p></Layout>;
  if (!request) return <Layout><p>Request not found</p></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/queue')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e62b1e',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0.5rem 0'
            }}
          >
            ← Back to Queue
          </button>
        </div>

        <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 600, marginBottom: '2rem' }}>
          Request Details
        </h2>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                Name
              </label>
              <p style={{ fontSize: '14px' }}>{request.name}</p>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                Email
              </label>
              <p style={{ fontSize: '14px', wordBreak: 'break-word' }}>{request.email}</p>
            </div>

            {request.phone && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                  Phone
                </label>
                <p style={{ fontSize: '14px' }}>{request.phone}</p>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                Event
              </label>
              <p style={{ fontSize: '14px' }}>{request.event_name}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                  Quantity
                </label>
                <p style={{ fontSize: '14px' }}>{request.qty}</p>
              </div>

              {request.seat_tier && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                    Seat Tier
                  </label>
                  <p style={{ fontSize: '14px' }}>{request.seat_tier}</p>
                </div>
              )}

              {request.payment_type && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                    Payment Type
                  </label>
                  <p style={{ fontSize: '14px' }}>{request.payment_type}</p>
                </div>
              )}
            </div>

            {request.proof_url && request.payment_type?.toLowerCase() !== 'cash' && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                  Proof of Payment
                </label>
                <a href={request.proof_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#e62b1e', textDecoration: 'underline' }}>
                  View Document
                </a>
              </div>
            )}

            {!request.proof_url && request.payment_type?.toLowerCase() !== 'cash' && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                  Proof of Payment
                </label>
                <p style={{ fontSize: '14px', padding: '0.75rem', background: '#fff3cd', borderRadius: '4px', color: '#856404', border: '1px solid #ffeaa7' }}>
                  ⚠️ No proof submitted
                </p>
              </div>
            )}

            {request.payment_type?.toLowerCase() === 'cash' && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                  Payment Method
                </label>
                <p style={{ fontSize: '14px', padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px', color: '#0369a1' }}>
                  Cash Payment - No proof required
                </p>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                Submitted
              </label>
              <p style={{ fontSize: '14px' }}>{new Date(request.created_at).toLocaleString()}</p>
            </div>

            {request.notes && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '14px' }}>
                  Notes
                </label>
                <p style={{ fontSize: '14px', padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px' }}>
                  {request.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {request.status === 'pending_review' && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 600, marginBottom: '1rem' }}>
                Approve Request
              </h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Button onClick={handleApprove} disabled={processing} style={{ flex: '1 1 auto', minWidth: '200px' }}>
                  Approve & Send Tickets
                </Button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 600, marginBottom: '1rem' }}>
                Reject Request
              </h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Rejection reason (required)..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  marginBottom: '1rem',
                  resize: 'vertical'
                }}
              />
              <Button 
                variant="danger" 
                onClick={handleReject} 
                disabled={processing || !reason.trim()}
                style={{ width: '100%', maxWidth: '300px' }}
              >
                Reject Request
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
