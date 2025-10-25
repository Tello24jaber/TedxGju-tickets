# Quick Start - Database Migration

## Run This SQL in Supabase

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the following SQL:

```sql
-- Add payment_type column to purchase_requests table
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_requests_payment_type 
ON purchase_requests(payment_type);

-- Add helpful comment
COMMENT ON COLUMN purchase_requests.payment_type IS 
  'Payment method used: Cash, Cliq, etc. If Cash, proof_url may be empty.';
```

5. Click **Run** or press `Ctrl+Enter` / `Cmd+Enter`
6. Verify the output shows "Success"

## Verify the Migration

Run this query to confirm the column was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_requests'
AND column_name = 'payment_type';
```

Expected output:
```
column_name   | data_type | is_nullable
--------------|-----------+-------------
payment_type  | text      | YES
```

## Done!

You can now deploy your updated code and the system will handle the Payment Type field.
