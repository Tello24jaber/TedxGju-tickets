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
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const load = async () => {
      try {
        const data = await getRequest(id);
        setRequest(data);
        setNotes(data.notes || '');
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
      await approveRequest(request.id, notes);
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/queue')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e62b1e',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Queue
          </button>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '2rem' }}>
          Request Details
        </h2>

        <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Name
              </label>
              <p>{request.name}</p>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Email
              </label>
              <p>{request.email}</p>
            </div>

            {request.phone && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Phone
                </label>
                <p>{request.phone}</p>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Event
              </label>
              <p>{request.event_name}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Quantity
                </label>
                <p>{request.qty}</p>
              </div>

              {request.seat_tier && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Seat Tier
                  </label>
                  <p>{request.seat_tier}</p>
                </div>
              )}
            </div>

            {request.proof_url && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Proof of Payment
                </label>
                <a href={request.proof_url} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Submitted
              </label>
              <p>{new Date(request.created_at).toLocaleString()}</p>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                placeholder="Add internal notes..."
              />
            </div>
          </div>
        </div>

        {request.status === 'pending_review' && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '1rem' }}>
                Approve Request
              </h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button onClick={handleApprove} disabled={processing}>
                  Approve & Send Tickets
                </Button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '1rem' }}>
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
                  marginBottom: '1rem'
                }}
              />
              <Button variant="danger" onClick={handleReject} disabled={processing || !reason.trim()}>
                Reject Request
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
