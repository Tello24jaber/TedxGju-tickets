// apps/api/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function logAudit(
  action: string,
  entity: string,
  entityId?: string,
  payload?: Record<string, any>,
  actorId?: string
) {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      payload
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}