# Razorpay Payment & Earnings Settlement System

Complete Razorpay integration for PrintEase with automatic earnings tracking and settlement management.

---

## 📋 Overview

This implementation provides:

1. **Payment Processing** - Users pay via Razorpay, payments go to a single admin account
2. **Automatic Earnings Tracking** - Shopkeeper earnings are automatically calculated per order
3. **Clear Settlement System** - Admin can settle shopkeeper earnings with detailed tracking
4. **No Confusion** - Transparent earnings display for both users and shopkeepers

---

## 🏗️ Architecture

```
USER PAYMENT FLOW:
User → Places Order → Pays ₹100 via Razorpay → Payment captured to Admin Account
                                           ↓
                                    Earning Created for Shopkeeper (₹100)
                                           ↓
                                    Shopkeeper sees in Dashboard
                                           ↓
                                    Admin settles at evening (Cash/UPI/Bank)
```

---

## 🔧 Backend Setup

### 1. Environment Variables

Add to `.env`:
```bash
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxxx_secret
```

### 2. Database Models

**Earning.js** - Tracks shopkeeper earnings per order
```
earning {
  shop: ObjectId,
  order: ObjectId,  // unique, one earning per order
  amount: Number,
  isSettled: Boolean,
  settlementId: ObjectId
}
```

**Settlement.js** - Tracks settlement transactions
```
settlement {
  shop: ObjectId,
  shopkeeper: ObjectId,
  ordersIncluded: [ObjectId],
  earningsIncluded: [ObjectId],
  totalAmount: Number,
  paymentMethod: 'cash' | 'bank_transfer' | 'upi',
  status: 'pending' | 'completed',
  completedAt: Date,
  referenceId: String
}
```

### 3. API Endpoints

#### Payment Routes (`/api/razorpay`)

```
POST /razorpay/create-order
  Input: { orderId }
  Output: { razorpayOrderId, amount, keyId, customerEmail, ... }

POST /razorpay/verify-payment
  Input: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }
  Output: { success: true, order: {...} }
  - Creates Earning automatically

GET /razorpay/payment-history
  Output: { data: [], totalAmount }

POST /razorpay/refund
  Input: { orderId, reason }
  Output: { success: true, refund: {...} }
```

#### Settlement Routes (`/api/settlements`)

```
GET /settlements/earnings?shopId=xxx
  Output: {
    unsettledEarnings: { count, totalAmount, orders: [] },
    settledEarnings: { count, orders: [] }
  }

GET /settlements/admin/unsettled (Admin Dashboard)
  Output: List of all shops with pending settlements

POST /settlements/create (Admin)
  Input: { shopId, paymentMethod, notes, referenceId }
  Output: { success: true, settlement: {...} }
  - Marks earnings as settled
  - Creates settlement record

GET /settlements/history?shopId=xxx
  Output: List of settlements with pagination

GET /settlements/:settlementId
  Output: Settlement details with included orders
```

---

## 📱 Mobile App Implementation

### 1. Install Razorpay Package

```bash
cd mobile-app
npm install react-native-razorpay
```

### 2. Update PaymentScreen.js

The integration automatically:
- Creates Razorpay order from backend
- Opens Razorpay checkout
- Verifies signature
- Shows success/failure alert

**Key import:**
```javascript
import RazorpayCheckout from 'react-native-razorpay';
```

### 3. Usage

```javascript
// In your navigation, pass order data
navigation.navigate('Payment', { order: orderData });

// PaymentScreen handles rest automatically
```

### 4. EarningsScreen

Shopkeepers can view:
- Total pending settlement amount
- List of pending orders
- Settlement history

**Usage:**
```javascript
navigation.navigate('Earnings', { shopId: shop._id });
```

---

## 🌐 Web App Implementation

### 1. Payment Flow

```javascript
import PaymentCheckout from '../components/PaymentCheckout';

<PaymentCheckout
  orderId={order._id}
  amount={order.totalAmount}
  shopName={order.shop.shopName}
  orderNumber={order.orderNumber}
  onPaymentSuccess={(order) => {
    // Handle success
    toast.success('Payment successful!');
  }}
/>
```

### 2. Shopkeeper Dashboard

```javascript
import EarningsDashboard from '../pages/EarningsDashboard';

// Displays:
// - Pending settlement amount
// - List of unsettled orders
// - Settlement history
// - Settlement creation form
```

### 3. Payment History

```javascript
import PaymentHistory from '../pages/PaymentHistory';

// Shows:
// - All user payments
// - Payment status (paid/pending/failed)
// - Order status
// - Transaction details
```

---

## 💰 Settlement Workflow

### For Shopkeepers

1. **View Earnings**
   - App shows: Total pending amount + number of orders
   - Each order shows: Amount, Customer name, Order status
   - Can see when order was placed and completed

2. **Wait for Settlement**
   - Admin will settle in evening
   - Earnings move from "Pending" to "Settled"

### For Admin/You

1. **Review Pending**
   - Go to Settlement Dashboard
   - Sees all shops with pending amounts
   - Sortable by amount/count

2. **Process Settlement**
   - Click "Mark as Settled" for each shop
   - Select payment method (Cash/UPI/Bank)
   - Add reference ID (check number, txn ID, etc.)
   - Optional notes
   - Confirm - earnings marked as settled

3. **View History**
   - All settlements tracked
   - Can see when, how much, via which method
   - Full audit trail

---

## 🔐 Security Notes

1. **Signature Verification**
   - Every payment is verified server-side
   - HMAC-SHA256 signature validation
   - Prevents tampering

2. **Payment Only to Admin**
   - All money comes to admin Razorpay account
   - No direct shop payments
   - Admin has full control

3. **Earning Tracking**
   - Can't be manually edited
   - Auto-created on payment
   - Linked to order in database

4. **Settlement Audit**
   - All settlements logged
   - Reference IDs for tracking
   - Who settled and when recorded

---

## 📊 Key Features

✅ **One-Click Payment** - Users pay via Razorpay, admin gets all money
✅ **Automatic Earnings** - System calculates shopkeeper earnings per order
✅ **Real-time Dashboard** - Both users and shopkeepers see updated info
✅ **Clear Tracking** - No hidden calculations, everything visible
✅ **Manual Settlement** - Admin control, flexible payment methods
✅ **Full Audit Trail** - Every transaction tracked
✅ **Refund Support** - Can refund orders if needed
✅ **Mobile+Web** - Works on both apps seamlessly

---

## 🚀 Testing

### 1. Razorpay Test Keys

Use test keys from Razorpay dashboard:
- Test mode: Use test credit cards
- Test UPI: `success@razorpay`

### 2. Test Flow

```bash
1. Create order in app
2. Go to payment
3. Use test card: 4111 1111 1111 1111
4. Any future date, any CVV
5. Payment should succeed
6. Check dashboard for earning
7. Process settlement
```

### 3. Verify in DB

```bash
# Check if earning was created
db.earnings.findOne({ Order: orderId })

# Check if payment details saved
db.orders.findOne({ _id: orderId }).razorpayPaymentId

# Check settlement
db.settlements.findOne({ shop: shopId })
```

---

## 📝 Important Notes

⚠️ **Payment Method**: All payments go to YOUR Razorpay account
⚠️ **Settlement**: Manual process - you decide when/how to settle shops
⚠️ **Earnings**: Fixed at payment time, can't be changed
⚠️ **Refunds**: Only you can refund orders
⚠️ **Taxes**: You're responsible for tax implications

---

## 🆘 Troubleshooting

### Payment fails
- Check Razorpay keys in `.env`
- Ensure order amount is > 0
- Check order exists in DB

### Earning not created
- Verify payment verification succeeded
- Check order.earning field in DB
- Check earnings collection for order

### Settlement issues
- Ensure shop ID is correct
- Check if earnings exist for shop
- Verify `isSettled: false` on earnings

### Mobile app errors
- Run: `npm install react-native-razorpay`
- On Android: Check AndroidManifest.xml permissions
- On iOS: Check Podfile updated

---

## 📞 Support

For Razorpay-specific issues:
- Docs: https://razorpay.com/docs/
- Dashboard: https://dashboard.razorpay.com/
- Support: https://razorpay.com/support/

---

## ✨ Future Enhancements

- Automated settlement (daily/weekly)
- TDS calculation & reporting
- Multi-currency support
- Bulk settlement
- Settlement analytics dashboard
- SMS notifications for settlements

