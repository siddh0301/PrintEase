import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import apiLogger from './middlewares/logger.middleware.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import shopsRoutes from './routes/shops.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import ratingsRoutes from './routes/ratings.routes.js';
import razorpayRoutes from './routes/razorpay.routes.js';
import settlementRoutes from './routes/settlement.routes.js';
import notificationsRoutes from './routes/notifications.js';




const app = express();

// 🔒 Security Middleware
app.use(helmet());

// 🔒 Additional Security Headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable browser XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.static('public'));
app.use(apiLogger);

// Test routes
app.get('/', (req, res) => {
  res.json({ message: 'Xerox Shop API is running!' });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Xerox Shop API',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/shops',
      '/api/orders',
      '/api/ratings',
      '/api/razorpay',
      '/api/settlements',
      '/api/notifications',
    ],
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/notifications', notificationsRoutes);

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(),'uploads')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

export default app;