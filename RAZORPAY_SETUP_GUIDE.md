# ✅ Razorpay Setup Checklist

Complete this checklist to get Razorpay working in PrintEase.

## 🔑 Step 1: Get Razorpay Keys

- [ ] Go to https://dashboard.razorpay.com/
- [ ] Create Razorpay account (or login)
- [ ] Go to Settings → API Keys
- [ ] Copy **Key ID** (starts with `rzp_live_` or `rzp_test_`)
- [ ] Copy **Key Secret**

## 🔧 Step 2: Backend Setup

### Add Environment Variables

**File:** `backend/.env`

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
```

### Install Dependencies

```bash
cd backend
npm install razorpay
npm install
```

### Verify Models Are Updated

- [ ] `Order.js` has: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `earning`
- [ ] `Earning.js` exists with proper schema
- [ ] `Settlement.js` exists with proper schema

### Routes Are Added

- [ ] `razorpay.routes.js` created
- [ ] `settlement.routes.js` created
- [ ] Both routes imported in `app.js`

### Test Backend

```bash
npm run dev
# Visit: http://localhost:5000/api
# Should show razorpay and settlements in endpoints
```

## 📱 Step 3: Mobile App Setup

### Install Package

```bash
cd mobile-app
npm install react-native-razorpay
```

### Update Files

- [ ] `PaymentScreen.js` updated with Razorpay integration
- [ ] `EarningsScreen.js` created
- [ ] `package.json` has `react-native-razorpay` dependency

### Test Mobile Payment

```bash
npm start
# Android: npm run android
# iOS: npm run ios

# Try placing order + payment
# Should open Razorpay checkout
```

## 🌐 Step 4: Web App Setup

### Add Razorpay Script

**File:** `web-app/index.html`

Add in `<head>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Update Files

- [ ] `payment.service.js` created
- [ ] `PaymentHistory.jsx` created
- [ ] `EarningsDashboard.jsx` created  
- [ ] `PaymentCheckout.jsx` created

### Test Web Payment

```bash
cd web-app
npm run dev

# Go to Orders page
# Click Pay button
# Should open Razorpay checkout
```

## 💳 Step 5: Test Payment

### Use Test Card

- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

### Payment Flow

1. Create order in app
2. Go to checkout/payment
3. Enter test card details
4. Payment should succeed ✅
5. Check dashboard to see earning created

## 🎯 Step 6: Admin Dashboard Setup

### Verify Endpoints

Test in Postman or similar:

```bash
# Create test order
POST /api/orders/create
Body: { shop, items, totalAmount, deliveryAddress }

# Simulate payment (for testing)
POST /api/razorpay/verify-payment
Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }

# View earnings
GET /api/settlements/earnings?shopId=xxx

# View pending (admin)
GET /api/settlements/admin/unsettled

# Create settlement
POST /api/settlements/create
Body: { shopId, paymentMethod: "cash", notes: "" }
```

## 📊 Step 7: Verify Database

Check MongoDB:

```javascript
// Orders have payment fields
db.orders.findOne()
// Should have: razorpayOrderId, razorpayPaymentId, earning

// Earnings created
db.earnings.findOne()
// Should have: shop, order, amount, isSettled

// After settlement
db.settlements.findOne()
// Should have: shop, totalAmount, status: 'completed'
```

## 🚀 Step 8: Live Deployment

When ready for production:

1. Get live Razorpay keys (not test keys)
2. Update `.env` with live keys
3. Update security settings in Razorpay dashboard
4. Set allowed domains for web app
5. Deploy backend and web/mobile apps

## ✨ Verify Everything Works

- [ ] User can create order
- [ ] Payment checkout opens
- [ ] Test payment succeeds
- [ ] Earning is created automatically
- [ ] Shopkeeper sees earning in dashboard
- [ ] Admin can create settlement
- [ ] Earning marked as settled
- [ ] Payment history shows in user profile
- [ ] Settlement history shows in admin panel

## 🎉 Done!

Your Razorpay payment system is ready!

### Quick Reference

**API Base**: `/api/razorpay` and `/api/settlements`
**Keys Location**: `backend/.env`
**Test Mode**: Use test keys, test card details
**Live Mode**: Use live keys only in production
**Admin Account**: All money comes to your Razorpay account
**Earnings**: Auto-tracked per order
**Settlement**: Manual process, settled via admin

---

## 📞 Need Help?

Razorpay Docs: https://razorpay.com/docs/
Chat with Razorpay: https://razorpay.com/support/
