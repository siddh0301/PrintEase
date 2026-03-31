# 🧪 Demo Mode Testing Guide

## Overview
Demo Mode simulates the entire Payment → Earning → Settlement flow **without real Razorpay API keys**. This allows you to test the application before setting up a live Razorpay account.

---

## What is Demo Mode?

Demo Mode replaces the real Razorpay checkout with simulated payment data. When enabled:
- ✅ Payment appears successful instantly
- ✅ Fake earnings are created in the database
- ✅ Settlement system works normally
- ✅ No real money is charged

**Currently Enabled**: `DEMO_MODE = true` in `mobile-app/src/screens/PaymentScreen.js`

---

## How to Test with Demo Mode

### Step 1: Verify Backend is Running
```bash
cd backend
npm start
```
Check that server shows: `Server running on port 5000`

### Step 2: Run Mobile App
```bash
cd mobile-app
npm start
```
Scan with Expo on your phone or use Android/iOS simulator.

### Step 3: Test Payment Flow

1. **Login** with a user account
2. **Create an order** for a shop (or use existing)
3. **Click "Pay Now"** button
   - Screen shows: 🧪 TEST MODE - Demo Payment
   - No real Razorpay checkout appears
   - 2-second delay simulates payment processing
4. **Click "View Orders"** after success
   - Order status changes to "Paid"

### Step 4: Verify Earning Was Created
1. **Switch to a shop account** (or use another mobile/browser)
2. **Go to Earnings Tab** (if mobile)
3. **See the pending earning** from the order you just paid for
   - Shows: Order Amount, Status: Unsettled

### Step 5: Test Settlement
1. **Login as Admin** on web app
2. **Go to Earnings Dashboard**
3. **Click "Create Settlement"**
4. **Select orders** and confirm
5. **See settlement recorded** in history

---

## Demo Mode Detection

Demo mode is **automatically detected** in two places:

### 1. Mobile App (PaymentScreen.js)
```javascript
const DEMO_MODE = true;
if (DEMO_MODE) {
  // Simulate with fake payment data
  const testPaymentData = {
    razorpay_order_id: 'test_order_' + Date.now(),
    razorpay_payment_id: 'test_pay_' + Date.now(),
    razorpay_signature: 'test_sig_' + Date.now()
  };
  verifyPayment(testPaymentData);
}
```

### 2. Backend (razorpay.controller.js)
```javascript
const DEMO_MODE = razorpayOrderId?.includes('test_order_');
if (!DEMO_MODE) {
  // Verify real Razorpay signature
}
```
When `razorpayOrderId` starts with `test_order_`, backend skips signature verification.

---

## Switching to Real Razorpay

When ready to use **real Razorpay**:

### Step 1: Get Test API Keys
1. Create account at https://razorpay.com
2. Go to **Settings → API Keys**
3. Copy **Key ID** and **Key Secret**

### Step 2: Update .env
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Disable Demo Mode
In `mobile-app/src/screens/PaymentScreen.js`:
```javascript
const DEMO_MODE = false;  // Change from true
```

### Step 4: Restart Backend
```bash
npm start
```

### Step 5: Test with Real Razorpay
- Click "Pay Now"
- Real Razorpay checkout appears
- Use test card: `4111 1111 1111 1111`

---

## Test Cards (Real Razorpay)

| Type | Number | Expiry | CVV |
|------|--------|--------|-----|
| Success | 4111 1111 1111 1111 | Any | Any |
| Failure | 4111 1111 1111 1112 | Any | Any |
| 3D Secure | 4366 0061 3010 0005 | Any | Any |

---

## Database Schema Verification

### Demo Mode Creates:
1. **Order** (if new): Updated with `paymentStatus: 'completed'`
2. **Earning**: New record with fake payment IDs
3. **Settlement** (via Dashboard): Links order to shopkeeper

### View Created Data:
```bash
# SSH into MongoDB
mongo

# Use PrintEase database
use printease

# View earnings
db.earnings.find({})

# View settlements
db.settlements.find({})
```

---

## Troubleshooting

### Payment shows "Processing..." forever
- Check backend is running: `npm start` in backend folder
- Check auth token is valid (re-login if needed)
- Check browser console for API errors

### Earning doesn't appear
- Wait 5 seconds for backend to process
- Check Network tab: verify `/api/razorpay/verify-payment` returned 200
- Check backend logs for errors

### Settlement can't be created
- Make sure earnings exist (do a payment first)
- Verify shop has at least one unsettled order
- Check you're logged in as admin

---

## After Testing

Once confident with demo flow, you can:
1. **Get real Razorpay keys** (follow "Switching to Real Razorpay" above)
2. **Enable real Razorpay** (set `DEMO_MODE = false`)
3. **Deploy to production** with real keys

---

## Need Help?

**Demo Mode Stuck?**
- Clear mobile app cache: Settings → Apps → PrintEase → Clear Cache
- Restart backend: Ctrl+C and `npm start`
- Check backend logs for SQL/Razorpay errors

**Real Razorpay Issues?**
- Check keys are correct in .env
- Test keys start with `rzp_test_`
- Verify no trailing spaces in .env values

