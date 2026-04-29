const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Stripe webhook (MUST be before express.json to receive raw body) ────────
const stripeWebhookRoutes = require('./routes/stripe');
app.use('/api/webhooks', stripeWebhookRoutes);

// Middlewares de sécurité et logging
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const commercantsRoutes = require('./routes/commercants');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const scanRoutes = require('./routes/scan');
const notificationsRoutes = require('./routes/notifications');
const avisRoutes = require('./routes/avis');
const geolocationRoutes = require('./routes/geolocation');
const menusRoutes = require('./routes/menus');
const offresRoutes = require('./routes/offres');
const analyticsRoutes = require('./routes/analytics');
const subscriptionRoutes = require('./routes/subscription');

app.use('/api/commercants', commercantsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/geolocation', geolocationRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/offres', offresRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'API Stamply - Backend Supabase',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      commercants: '/api/commercants',
      wallet: '/api/wallet',
      scan: '/api/scan',
      notifications: '/api/notifications',
      avis: '/api/avis',
      geolocation: '/api/geolocation',
      menus: '/api/menus',
      offres: '/api/offres',
      analytics: '/api/analytics',
      subscription: '/api/subscription',
      webhooks: '/api/webhooks'
    }
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Stamply démarré sur http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
});

module.exports = app;
