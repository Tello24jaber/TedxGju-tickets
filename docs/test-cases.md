# TEDxGJU Ticket System - Test Cases

## Prerequisites

- Supabase database set up with schema
- Google Sheets connected with service account
- Email provider configured
- Local or deployed environment running

## 1. Google Sheets Integration

### Test Case 1.1: Sync New Rows
**Steps:**
1. Add 3 new form responses to Google Sheets (Responses tab)
2. Login to admin dashboard
3. Click "Sync Google Sheets" button

**Expected:**
- Success message showing "Sync completed: 3 rows"
- 3 new entries appear in Queue with status "pending_review"
- `last_synced_row` in `system_state` table updated

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 1.2: No Duplicate Sync
**Steps:**
1. Click "Sync Google Sheets" again without adding new rows

**Expected:**
- Message: "No new rows to sync"
- No duplicate entries in database

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 2. Approval Workflow

### Test Case 2.1: Single Ticket Approval
**Steps:**
1. In Queue, click "Review" on a request with qty=1
2. Add notes: "Test approval"
3. Click "Approve & Send Tickets"

**Expected:**
- Success message "Request approved! Tickets sent"
- Request status changes to "approved"
- 1 ticket created in `tickets` table with status "valid"
- Email received with 1 PDF attachment (<500 KB)
- PDF shows correct name, event, QR code, and ticket ID
- Audit log entry created for "approve_request"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 2.2: Multiple Tickets Approval (qty=2)
**Steps:**
1. Approve a request with qty=2

**Expected:**
- 2 separate tickets created with unique tokens
- Email contains 2 PDF attachments
- Both PDFs have unique QR codes
- Each PDF is <500 KB

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 2.3: Rejection Flow
**Steps:**
1. Review a pending request
2. Enter rejection reason: "Incomplete payment proof"
3. Click "Reject Request"

**Expected:**
- Request status changes to "rejected"
- Rejection email sent to purchaser
- Email includes rejection reason
- No tickets created
- Audit log entry for "reject_request"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 3. Ticket Redemption (One-Scan Validation)

### Test Case 3.1: Valid First Scan
**Steps:**
1. Open scanner page (/scan)
2. Scan QR code from a valid ticket (or enter token manually)

**Expected:**
- GREEN screen with "ADMIT"
- Shows purchaser name, event name, seat tier
- Ticket status changes to "redeemed" in database
- `redeemed_at` timestamp recorded
- Audit log entry for "redeem_success"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 3.2: Double-Scan Prevention (Race Condition)
**Steps:**
1. Scan the same ticket again immediately

**Expected:**
- RED screen with "DENIED"
- Message: "Ticket already redeemed"
- Shows original redemption timestamp
- Audit log entry for "redeem_failed" with reason "already_redeemed"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 3.3: Cancelled Ticket Scan
**Steps:**
1. From Tickets page, cancel a valid ticket
2. Attempt to scan the cancelled ticket

**Expected:**
- RED screen with "DENIED"
- Message: "Ticket has been cancelled"
- Audit log for "redeem_failed" with reason "cancelled"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 3.4: Invalid Token
**Steps:**
1. Enter a random/fake token in scanner

**Expected:**
- RED screen with "DENIED"
- Message: "Invalid ticket"
- Audit log for "redeem_failed" with reason "invalid"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 4. Ticket Management

### Test Case 4.1: Resend Ticket
**Steps:**
1. Go to Tickets page
2. Search for a ticket by email
3. Click "Resend"

**Expected:**
- Success message
- Email re-sent with PDF attachment
- Ticket status unchanged
- Audit log for "resend_ticket"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 4.2: Cancel Valid Ticket
**Steps:**
1. Find a "valid" ticket
2. Click "Cancel"
3. Confirm cancellation

**Expected:**
- Ticket status changes to "cancelled"
- Cancel button disappears
- Audit log for "cancel_ticket"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 4.3: Search Functionality
**Steps:**
1. Enter partial email in search box
2. Wait for results

**Expected:**
- Only matching tickets displayed
- Search is case-insensitive
- Works for name, email, and ticket ID

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 5. Scanner Page

### Test Case 5.1: QR Camera Scanning
**Steps:**
1. Open /scan on mobile device
2. Click "Start Scanner"
3. Point camera at QR code

**Expected:**
- Camera activates
- QR detected and auto-submitted
- Result shown (GREEN or RED)
- Scanner stops after scan

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 5.2: Manual Token Entry
**Steps:**
1. Copy a token from database
2. Paste into "Or enter token manually" field
3. Click "Check"

**Expected:**
- Same validation as QR scan
- Result displayed correctly

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 6. Scan Monitor

### Test Case 6.1: Real-time Updates
**Steps:**
1. Open Scan Monitor page
2. Scan a ticket from another device
3. Wait up to 10 seconds

**Expected:**
- New redemption appears in the list
- Shows time, name, event, token (masked)
- Auto-refreshes every 10 seconds

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 7. Reports

### Test Case 7.1: Statistics Display
**Steps:**
1. Open Reports page

**Expected:**
- All stat cards show correct counts
- Redemption rate percentage calculated correctly
- Progress bar reflects redemption rate
- Cards have appropriate colors

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 8. Email & PDF Quality

### Test Case 8.1: Email Delivery
**Steps:**
1. Approve a request
2. Check recipient's inbox (including spam)

**Expected:**
- Email arrives within 2 minutes
- From: TEDxGJU <your@email.com>
- Subject: "Your TEDxGJU Ticket(s)"
- HTML formatted with logo and styling
- PDF attachment(s) present
- Fallback view link works

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 8.2: PDF Quality
**Steps:**
1. Open PDF attachment

**Expected:**
- A4 portrait format
- TEDxGJU branding visible
- QR code clear and scannable (test with phone)
- File size <500 KB
- All text readable
- Ticket ID, name, event details present
- Footer with warning and support email

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 8.3: QR Code Scannability
**Steps:**
1. Print PDF or display on screen
2. Scan with mid-range smartphone camera

**Expected:**
- QR detected and decoded successfully
- URL redirects to /r/:token endpoint
- Token extracted correctly

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 9. Security & Edge Cases

### Test Case 9.1: Unauthorized Access
**Steps:**
1. Log out
2. Try to access /queue or /tickets directly

**Expected:**
- Redirected to /login
- Cannot access protected routes

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 9.2: Rate Limiting
**Steps:**
1. Make 15+ rapid POST /api/redeem requests

**Expected:**
- After 10 requests in 1 minute, 429 error
- Message: "Too many redemption attempts"

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 9.3: SQL Injection Attempt
**Steps:**
1. Enter `' OR 1=1--` in search fields

**Expected:**
- No error
- No unauthorized data exposed
- Parameterized queries prevent injection

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## 10. Responsive Design

### Test Case 10.1: Mobile Dashboard
**Steps:**
1. Open dashboard on mobile device (320px width)

**Expected:**
- Layout adapts (stacked, not horizontal scroll)
- Buttons/tables usable
- Text readable without zoom

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

### Test Case 10.2: Scanner on Mobile
**Steps:**
1. Open /scan on mobile
2. Test camera scanning

**Expected:**
- Camera activates properly
- QR viewfinder visible
- Result screen readable
- Torch toggle works (if device supports)

**Actual:**
- [ ] Pass
- [ ] Fail (notes: ________________)

---

## Summary

**Total Test Cases:** 24
**Passed:** _____
**Failed:** _____
**Skipped:** _____

**Critical Issues:**
- [ ] None
- [ ] List any blockers found

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
