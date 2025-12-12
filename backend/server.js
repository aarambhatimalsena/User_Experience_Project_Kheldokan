import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';

import connectDB from './config/db.js';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// ======================
// 🌱 Environment
// ======================
dotenv.config();

const FRONTEND_ORIGIN =
  process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();

// ======================
// 🔐 Global Security Middleware
// ======================
app.use(helmet());

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Fix query object bug for mongoSanitize
app.use((req, res, next) => {
  const currentQuery = req.query;

  Object.defineProperty(req, 'query', {
    value: { ...currentQuery },
    writable: true,
    configurable: true,
    enumerable: true,
  });

  next();
});

app.use(mongoSanitize());
app.use(xssClean());

// ======================
// 🚏 Routes
// ======================
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: 'Route not found.' });
});

// ======================
// 🚀 Start Server ONLY After DB Connects
// ======================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Failed to start server:', err);
    });
}

export default app;
