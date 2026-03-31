# 🔗 Razorpay API Reference

Complete API documentation for all payment and settlement endpoints.

---

## Authentication

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Payment Endpoints

### 1. Create Razorpay Order

**Endpoint:** `POST /api/razorpay/create-order`

**Purpose:** Initialize payment, get Razorpay Order ID

**Request:**
```json
{
  "orderId": "507f1f77bcf86cd799439011"
}
```

**Response (Success):**
```json
{
  "success": true,
  "razorpayOrderId": "order_1234567890",
  "amount": 100,
  "currency": "INR",
  "customerEmail": "user@example.com",
  "customerPhone": "9876543210",
  "customerName": "John Doe",
  "keyId": "rzp_live_xxxxx"
}
```

**Response (Error):**
```json
{
  "message": "Failed to create payment order",
  "error": "Order not found"
}
```

**Usage:**
```javascript
const result = await axios.post('/api/razorpay/create-order', {
  orderId: '507f1f77bcf86cd799439011'
});
const { razorpayOrderId, amount, keyId } = result.data;
```

---

### 2. Verify Payment

**Endpoint:** `POST /api/razorpay/verify-payment`

**Purpose:** Verify payment signature and complete transaction

**Request:**
```json
{
  "razorpayOrderId": "order_1234567890",
  "razorpayPaymentId": "pay_1234567890",
  "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
  "orderId": "507f1f77bcf86cd799439011"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "JOHN-123456",
    "totalAmount": 100,
    "paymentStatus": "paid"
  }
}
```

**Response (Error):**
```json
{
  "message": "Payment verification failed",
  "error": "Signature mismatch"
}
```

**What Happens:**
- ✅ Verifies Razorpay signature
- ✅ Updates order: `paymentStatus = 'paid'`
- ✅ Creates Earning record for shopkeeper
- ✅ Links earning to order

**Usage:**
```javascript
const result = await axios.post('/api/razorpay/verify-payment', {
  razorpayOrderId: paymentData.razorpay_order_id,
  razorpayPaymentId: paymentData.razorpay_payment_id,
  razorpaySignature: paymentData.razorpay_signature,
  orderId: order._id
});
```

---

### 3. Get Payment History

**Endpoint:** `GET /api/razorpay/payment-history`

**Purpose:** Get user's payment history (for customers)

**Query Params:** None (uses authenticated user's ID)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "507f1f77bcf86cd799439011",
      "orderNumber": "JOHN-123456",
      "shopName": "John's Xerox Shop",
      "amount": 100,
      "paymentStatus": "paid",
      "orderStatus": "completed",
      "razorpayPaymentId": "pay_1234567890",
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T11:30:00Z"
    }
  ],
  "totalAmount": 500
}
```

**Usage:**
```javascript
const history = await axios.get('/api/razorpay/payment-history');
console.log(`Total spent: ₹${history.data.totalAmount}`);
```

---

### 4. Refund Payment

**Endpoint:** `POST /api/razorpay/refund`

**Purpose:** Refund a paid order

**Request:**
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "reason": "Order cancelled by customer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "refund": {
    "id": "rfnd_1234567890",
    "amount": 10000,
    "status": "processed"
  }
}
```

**What Happens:**
- ✅ Creates refund in Razorpay
- ✅ Updates order: `paymentStatus = 'refunded'`
- ✅ Marks earning as settled (removes from settlement)

**Usage:**
```javascript
await axios.post('/api/razorpay/refund', {
  orderId: '507f1f77bcf86cd799439011',
  reason: 'Quality issue'
});
```

---

## Settlement Endpoints

### 5. Get Shopkeeper Earnings

**Endpoint:** `GET /api/settlements/earnings`

**Purpose:** Get earnings for a specific shop (shopkeeper view)

**Query Params:**
```
shopId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "shopId": "507f1f77bcf86cd799439011",
  "unsettledEarnings": {
    "count": 5,
    "totalAmount": 500,
    "orders": [
      {
        "orderId": "507f1f77bcf86cd799439012",
        "orderNumber": "CUSTOMER-234567",
        "customerName": "John Doe",
        "amount": 100,
        "orderStatus": "completed",
        "createdAt": "2024-01-15T10:30:00Z",
        "completedAt": "2024-01-15T11:30:00Z"
      }
    ]
  },
  "settledEarnings": {
    "count": 20,
    "orders": [
      {
        "orderId": "507f1f77bcf86cd799439013",
        "amount": 150,
        "settledAt": "2024-01-14T18:00:00Z",
        "settlementMethod": "cash",
        "referenceId": "SETTLE-001"
      }
    ]
  }
}
```

**Usage:**
```javascript
const earnings = await axios.get('/api/settlements/earnings', {
  params: { shopId: '507f1f77bcf86cd799439011' }
});
console.log(`Pending: ₹${earnings.data.unsettledEarnings.totalAmount}`);
```

---

### 6. Get All Unsettled Earnings (Admin)

**Endpoint:** `GET /api/settlements/admin/unsettled`

**Purpose:** View all pending settlements across all shops (admin dashboard)

**Query Params:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "shopId": "507f1f77bcf86cd799439011",
      "shopName": "John's Xerox Shop",
      "ownerName": "John Doe",
      "ownerPhone": "9876543210",
      "totalAmount": 500,
      "orderCount": 5
    },
    {
      "shopId": "507f1f77bcf86cd799439012",
      "shopName": "Quick Print Center",
      "ownerName": "Jane Smith",
      "ownerPhone": "9876543211",
      "totalAmount": 300,
      "orderCount": 3
    }
  ]
}
```

**Usage:**
```javascript
const pending = await axios.get('/api/settlements/admin/unsettled');
pending.data.data.forEach(shop => {
  console.log(`${shop.shopName}: ₹${shop.totalAmount}`);
});
```

---

### 7. Create Settlement (Admin)

**Endpoint:** `POST /api/settlements/create`

**Purpose:** Mark earnings as settled, process settlement

**Request:**
```json
{
  "shopId": "507f1f77bcf86cd799439011",
  "paymentMethod": "cash",
  "notes": "Evening settlement - paid to John",
  "referenceId": "CASH-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settlement created successfully",
  "settlement": {
    "settlementId": "507f1f77bcf86cd799439099",
    "shopName": "John's Xerox Shop",
    "shopkeeperName": "John Doe",
    "totalAmount": 500,
    "ordersCount": 5,
    "status": "completed",
    "paymentMethod": "cash",
    "completedAt": "2024-01-15T18:00:00Z"
  }
}
```

**What Happens:**
- ✅ Creates settlement record
- ✅ Marks all earning records as settled
- ✅ Records payment method
- ✅ Logs who settled and when

**Parameters:**
| Param | Type | Required | Options |
|-------|------|----------|---------|
| shopId | String | Yes | - |
| paymentMethod | String | No | cash, bank_transfer, upi, other |
| notes | String | No | Any text |
| referenceId | String | No | Check #, Transaction ID, etc |

**Usage:**
```javascript
const settlement = await axios.post('/api/settlements/create', {
  shopId: '507f1f77bcf86cd799439011',
  paymentMethod: 'cash',
  notes: 'Evening settlement completed',
  referenceId: 'EVENING-001'
});
console.log(`Settlement created: ₹${settlement.data.settlement.totalAmount}`);
```

---

### 8. Get Settlement History

**Endpoint:** `GET /api/settlements/history`

**Purpose:** View settlement history (filtered by shop)

**Query Params:**
```
shopId=507f1f77bcf86cd799439011 (optional)
limit=20 (default)
skip=0 (default)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439099",
      "shop": {
        "_id": "507f1f77bcf86cd799439011",
        "shopName": "John's Xerox Shop"
      },
      "shopkeeper": {
        "_id": "507f1f77bcf86cd799439001",
        "name": "John Doe",
        "phone": "9876543210"
      },
      "totalAmount": 500,
      "status": "completed",
      "paymentMethod": "cash",
      "referenceId": "SETTLE-001",
      "createdAt": "2024-01-15T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "skip": 0,
    "pages": 1
  }
}
```

**Usage:**
```javascript
const history = await axios.get('/api/settlements/history', {
  params: { shopId: '507f1f77bcf86cd799439011' }
});
```

---

### 9. Get Settlement Details

**Endpoint:** `GET /api/settlements/:settlementId`

**Purpose:** Get detailed info about a specific settlement

**URL Params:**
```
:settlementId = 507f1f77bcf86cd799439099
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439099",
    "shop": {
      "_id": "507f1f77bcf86cd799439011",
      "shopName": "John's Xerox Shop"
    },
    "shopkeeper": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com"
    },
    "totalAmount": 500,
    "ordersCount": 5,
    "status": "completed",
    "paymentMethod": "cash",
    "referenceId": "SETTLE-001",
    "notes": "Evening settlement",
    "settledBy": {
      "_id": "507f1f77bcf86cd799439000",
      "name": "Admin",
      "email": "admin@example.com"
    },
    "ordersIncluded": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "orderNumber": "CUSTOMER-234567",
        "totalAmount": 100,
        "customer": {
          "_id": "507f1f77bcf86cd799439002",
          "name": "Customer Name",
          "email": "customer@example.com"
        }
      }
    ],
    "completedAt": "2024-01-15T18:00:00Z",
    "createdAt": "2024-01-15T18:00:00Z"
  }
}
```

**Usage:**
```javascript
const details = await axios.get('/api/settlements/507f1f77bcf86cd799439099');
details.data.data.ordersIncluded.forEach(order => {
  console.log(`${order.orderNumber}: ₹${order.totalAmount}`);
});
```

---

## Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 400 | Order not found | OrderID doesn't exist |
| 401 | No token provided | Missing authorization header |
| 403 | Unauthorized access | Not allowed to view this resource |
| 404 | Resource not found | Resource doesn't exist |
| 500 | Server error | Backend error, check logs |

---

## Example Workflows

### Complete Payment Flow (Frontend)

```javascript
// 1. User clicks Pay
const orderData = await axios.post('/api/razorpay/create-order', {
  orderId: order._id
});

// 2. Open Razorpay
const options = {
  key: orderData.keyId,
  amount: orderData.amount * 100,
  order_id: orderData.razorpayOrderId,
  // ... other options
  handler: async (response) => {
    // 3. Verify payment
    const verified = await axios.post('/api/razorpay/verify-payment', {
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
      orderId: order._id
    });
    
    if (verified.data.success) {
      // Payment successful!
      showSuccessMessage();
    }
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### Shopkeeper Settlement Flow (Backend/Admin)

```javascript
// 1. Get all pending
const pending = await axios.get('/api/settlements/admin/unsettled');

// 2. Find a shop to settle
const shop = pending.data.data[0];

// 3. Create settlement
const settlement = await axios.post('/api/settlements/create', {
  shopId: shop.shopId,
  paymentMethod: 'cash',
  notes: `Settled ₹${shop.totalAmount}`,
  referenceId: `SETTLE-${Date.now()}`
});

// 4. Earnings now marked as settled
// 5. Shopkeeper can see in their history
```

---

## Testing with cURL

### Create Order
```bash
curl -X POST http://localhost:5000/api/razorpay/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"507f1f77bcf86cd799439011"}'
```

### Get Payment History
```bash
curl -X GET http://localhost:5000/api/razorpay/payment-history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Earnings
```bash
curl -X GET "http://localhost:5000/api/settlements/earnings?shopId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Rate Limiting

No rate limiting currently implemented. Add if needed:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

