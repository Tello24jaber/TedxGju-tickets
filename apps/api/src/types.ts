// Shared types for API
export type PurchaseRequestStatus = 'pending_review' | 'approved' | 'rejected';
export type TicketStatus = 'valid' | 'redeemed' | 'cancelled' | 'expired';

export interface PurchaseRequest {
  id: string;
  sheet_row_id: number;
  name: string;
  email: string;
  phone?: string;
  event_name: string;
  qty: number;
  seat_tier?: string;
  proof_url?: string;
  status: PurchaseRequestStatus;
  reviewer_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  event_name: string;
  purchaser_name: string;
  purchaser_email: string;
  seat_tier?: string;
  token: string;
  status: TicketStatus;
  issued_at: string;
  redeemed_at?: string;
  redeemed_by?: string;
  purchase_request_id?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  payload?: Record<string, any>;
  created_at: string;
}

export interface SheetRow {
  rowIndex: number;
  timestamp: string;
  fullName: string;
  email: string;
  phone?: string;
  eventName: string;
  quantity: number;
  seatTier?: string;
  proofUrl?: string;
  notes?: string;
}

export interface RedeemRequest {
  token: string;
}

export interface RedeemResponse {
  success: boolean;
  message: string;
  ticket?: {
    id: string;
    event_name: string;
    purchaser_name: string;
    seat_tier?: string;
  };
  redeemed_at?: string;
}

export interface Stats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  total_tickets: number;
  valid_tickets: number;
  redeemed_tickets: number;
  cancelled_tickets: number;
}
