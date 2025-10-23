// apps/web/src/pages/Tickets.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { getTickets, resendTicket, cancelTicket } from '../lib/api';
import type { Ticket } from '../types';

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await getTickets();
      setTickets(data.data || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id: string) => {
    if (!window.confirm('Resend this ticket?')) return;
    
    try {
      setProcessing(id);
      await resendTicket(id);
      alert('Ticket resent!');
    } catch (error) {
      alert('Resend failed');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this ticket? This cannot be undone.')) return;
    
    try {
      setProcessing(id);
      await cancelTicket(id);
      alert('Ticket cancelled');
      loadTickets();
    } catch (error) {
      alert('Cancel failed');
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 600, marginBottom: '2rem' }}>
          Tickets
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : tickets.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
            No tickets found
          </p>
        ) : (
          <div className="table-container" style={{ overflow: 'auto', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Event</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Issued</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '12px' }}>
                      {ticket.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>{ticket.purchaser_name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px', wordBreak: 'break-word' }}>{ticket.purchaser_email}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>{ticket.event_name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        background: 
                          ticket.status === 'valid' ? '#d4edda' :
                          ticket.status === 'redeemed' ? '#d1ecf1' :
                          ticket.status === 'cancelled' ? '#f8d7da' : '#fff3cd',
                        color:
                          ticket.status === 'valid' ? '#155724' :
                          ticket.status === 'redeemed' ? '#0c5460' :
                          ticket.status === 'cancelled' ? '#721c24' : '#856404'
                      }}>
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {new Date(ticket.issued_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                          onClick={() => handleResend(ticket.id)}
                          variant="secondary"
                          disabled={processing === ticket.id}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          Resend
                        </Button>
                        {ticket.status === 'valid' && (
                          <Button
                            onClick={() => handleCancel(ticket.id)}
                            variant="danger"
                            disabled={processing === ticket.id}
                            style={{ padding: '0.5rem 0.75rem', fontSize: '12px', whiteSpace: 'nowrap' }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
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
