// apps/web/src/lib/api.ts
import { supabase } from './supabase';

// ALWAYS use empty string to force same-origin requests via Netlify proxy
// This completely eliminates CORS issues
// If VITE_API_URL is set in Netlify env vars, it will override this
const API_URL = import.meta.env.VITE_API_URL ?? '';

// Log to verify what's being used (remove in production if needed)
console.log('API_URL configured as:', API_URL || '(same-origin)');

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
  };
}

export async function syncGoogleSheets() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/sync-google`, {
    method: 'POST',
    headers
  });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}

export async function getRequests(status?: string, search?: string) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  
  const res = await fetch(`${API_URL}/api/admin/requests?${params}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch requests');
  return res.json();
}

export async function getRequest(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/requests/${id}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch request');
  return res.json();
}

export async function approveRequest(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/requests/${id}/approve`, {
    method: 'POST',
    headers
  });
  if (!res.ok) throw new Error('Failed to approve');
  return res.json();
}

export async function rejectRequest(id: string, reason?: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/requests/${id}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error('Failed to reject');
  return res.json();
}

export async function getTickets(status?: string) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  
  const res = await fetch(`${API_URL}/api/tickets?${params}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function resendTicket(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/tickets/${id}/resend`, {
    method: 'POST',
    headers
  });
  if (!res.ok) throw new Error('Failed to resend');
  return res.json();
}

export async function cancelTicket(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/tickets/${id}/cancel`, {
    method: 'POST',
    headers
  });
  if (!res.ok) throw new Error('Failed to cancel');
  return res.json();
}

export async function getRedemptions() {
  const res = await fetch(`${API_URL}/api/redemptions`);
  if (!res.ok) throw new Error('Failed to fetch redemptions');
  return res.json();
}

export async function redeemTicket(token: string) {
  const res = await fetch(`${API_URL}/api/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  if (!res.ok) throw new Error('Redemption failed');
  return res.json();
}

export async function getStats() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/stats`, { headers });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
