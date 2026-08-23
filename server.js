require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { sequelize } = require('./src/database/connection');

const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');
const returnRoutes = require('./src/routes/returns');
const cartRoutes = require('./src/routes/cart');
const adminRoutes = require('./src/routes/admin');
const wishlistRoutes = require('./src/routes/wishlist');
const reviewRoutes = require('./src/routes/reviews');
const sellerRoutes = require('./src/routes/sellers');
const cmsRoutes = require('./src/routes/cms');
const notificationRoutes = require('./src/routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'northstar_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve frontend pages — core
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/products', (req, res) => res.sendFile(path.join(__dirname, 'public', 'products.html')));
app.get('/product/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'product-detail.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));
app.get('/order-confirmation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'order-confirmation.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/wishlist', (req, res) => res.sendFile(path.join(__dirname, 'public', 'wishlist.html')));
// Support & info pages
app.get('/help', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'help.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'contact.html')));
app.get('/faq', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'faq.html')));
app.get('/shipping', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'shipping.html')));
app.get('/return-policy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'return-policy.html')));
app.get('/payment-info', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'payment-info.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'terms.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'privacy.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support', 'about.html')));
// Seller portal
app.get('/seller', (req, res) => res.sendFile(path.join(__dirname, 'public', 'seller', 'index.html')));
app.get('/seller/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'seller', 'register.html')));
app.get('/seller/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'seller', 'dashboard.html')));
app.get('/seller/products', (req, res) => res.sendFile(path.join(__dirname, 'public', 'seller', 'products.html')));
app.get('/seller/orders', (req, res) => res.sendFile(path.join(__dirname, 'public', 'seller', 'orders.html')));
app.get('/seller/wallet', (req, res) => res.sendFile(path.join(__dirname, 'public', 'seller', 'wallet.html')));
app.get('/seller/analytics', (req, res) => res.sendFile(path.join(__dirname, 'public', 'seller', 'analytics.html')));
app.get('/seller/settings', (req, res) => res.sendFile(path.join(__dirname, 'public', 'seller', 'settings.html')));

// 404
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync({ alter: false });
    console.log('✅ Models synced');
    app.listen(PORT, () => console.log(`🚀 Northstar running at http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
}

start();
