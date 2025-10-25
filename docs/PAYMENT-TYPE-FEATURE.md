# Payment Type Feature Documentation

## Overview
This document describes the implementation of the Payment Type field feature, which allows the system to handle different payment methods (Cash, Cliq, etc.) from Google Forms.

## Changes Made

### 1. Database Schema Updates

#### New Column Added
- **Table**: `purchase_requests`
- **Column**: `payment_type` (TEXT, nullable)
- **Purpose**: Store the payment method selected by the user (e.g., "Cash", "Cliq")

#### Migration File
- Location: `docs/migration-add-payment-type.sql`
- Run this SQL migration on your Supabase database to add the column

```sql
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS payment_type TEXT;
```

### 2. Type Definitions Updated

Updated type definitions in three locations:
- `shared/types.ts`
- `apps/api/src/types.ts`
- `apps/web/src/types.ts`

Added `payment_type?: string` to:
- `PurchaseRequest` interface
- `SheetRow` interface

### 3. Google Sheets Service

**File**: `apps/api/src/services/google-sheets.ts`

Updated the `getNewRows()` method to extract the payment type from the Google Sheet:
```typescript
const paymentType = getCell('payment type') || getCell('payment');
```

The service now looks for columns containing "payment type" or "payment" in the header.

### 4. API Routes

**File**: `apps/api/src/routes/admin.ts`

Updated the sync endpoint to include `payment_type` when creating purchase requests:
```typescript
const requests = newRows.map(row => ({
  ...
  payment_type: row.paymentType,
  ...
}));
```

### 5. Web UI Updates

#### Queue Page (`apps/web/src/pages/Queue.tsx`)
- Added "Payment" column to the requests table
- Displays the payment type for each request
- Shows "-" if payment type is not specified

#### Request Detail Page (`apps/web/src/pages/RequestDetail.tsx`)
- Added "Payment Type" field in the request details
- Conditional display of proof of payment:
  - **If payment type is "Cash"**: Shows a blue info box stating "Cash Payment - No proof required"
  - **If payment type is NOT "Cash"**: Shows the "Proof of Payment" link (if proof_url exists)
- This prevents reviewers from looking for payment proof when the user selected Cash payment

## Google Form Setup

Your Google Form should have these fields (in order):
1. **Timestamp** (auto-generated)
2. **Full Name** (text)
3. **Email (You will receive your ticket here)** (email)
4. **Phone Number** (text/number)
5. **Proof Of Payment (Cliq:TEDXGJU)** (file upload) - optional for Cash payments
6. **Payment Type** (multiple choice: Cash, Cliq, etc.)

### Important Notes:
- The "Proof Of Payment" field should be **optional** or have conditional logic to hide it when "Cash" is selected
- The "Payment Type" field should come before or after the proof field
- The exact column names in Google Sheets should match the headers above

## How It Works

### Workflow
1. User fills out Google Form
2. User selects payment type (Cash, Cliq, etc.)
3. If Cash: No proof of payment is required/uploaded
4. If Cliq (or other): User uploads proof of payment
5. Admin syncs Google Sheets via the dashboard
6. System reads all fields including `payment_type`
7. Data is stored in `purchase_requests` table
8. Admin reviews request:
   - Can see the payment type
   - If Cash: Sees info message instead of proof link
   - If Cliq: Sees link to proof document
9. Admin approves/rejects based on review

### Validation Logic
The system does NOT enforce validation that:
- Cash payments must have empty `proof_url`
- Non-cash payments must have `proof_url`

This is intentional to allow flexibility. Reviewers can manually verify during the approval process.

## Testing Checklist

- [ ] Run database migration to add `payment_type` column
- [ ] Update Google Form to include Payment Type field
- [ ] Test syncing from Google Sheets with Cash payment
- [ ] Test syncing from Google Sheets with Cliq payment
- [ ] Verify Queue page shows payment type column
- [ ] Verify Request Detail page shows:
  - [ ] Payment type field
  - [ ] Cash payment info box (when payment type is Cash)
  - [ ] Proof of payment link (when payment type is NOT Cash and proof exists)
- [ ] Test approving Cash payment request
- [ ] Test approving Cliq payment request
- [ ] Verify tickets are generated correctly for both payment types

## Future Enhancements

Potential improvements:
1. Add payment type filter in the Queue page
2. Add validation warnings if proof is missing for non-Cash payments
3. Generate reports showing breakdown by payment type
4. Add payment type statistics to the dashboard
5. Send different email templates based on payment type
