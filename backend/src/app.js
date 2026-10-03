const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { resolveUploadRoot } = require('./utils/uploadPaths');

const authRoutes = require('./routes/auth.routes');
const uploadRoutes = require('./routes/upload.routes');
const userRoutes = require('./routes/user.routes');
const providerRoutes = require('./routes/provider.routes');
const transporterRoutes = require('./routes/transporter.routes');
const transportRequestRoutes = require('./routes/transportRequest.routes');
const serviceRequestRoutes = require('./routes/serviceRequest.routes');
const commissionRoutes = require('./routes/commission.routes');
const zoneRoutes = require('./routes/zone.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const storeRoutes = require('./routes/store.routes');
const adminRoutes = require('./routes/admin.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes');
const systemSettingsRoutes = require('./routes/systemSettings.routes');
const subAdminRoutes = require('./routes/subAdmin.routes');
const archivedAccountRoutes = require('./routes/archivedAccount.routes');
const cmsPageRoutes = require('./routes/cmsPage.routes');
const notificationRoutes = require('./routes/notification.routes');
const brandingRoutes = require('./routes/branding.routes');
const bannerRoutes = require('./routes/banner.routes');
const paymentRoutes = require('./routes/payment.routes');
const paymentController = require('./controllers/payment.controller');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
// Razorpay webhook signature verification needs the exact raw request bytes,
// so this must be registered before express.json() parses (and discards) them.
app.post('/api/payments/webhook/razorpay', express.raw({ type: 'application/json' }), paymentController.handleRazorpayWebhook);
app.use(express.json());
// Uploaded images must be embeddable cross-origin (frontend and backend run on
// different origins) — helmet's default same-origin CORP blocks <img> loads
// even though CORS allows them, so relax it for this route only.
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(resolveUploadRoot())
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/branding', brandingRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/transporters', transporterRoutes);
app.use('/api/transport', transportRequestRoutes);
app.use('/api/services', serviceRequestRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin/system-settings', systemSettingsRoutes);
app.use('/api/admin/sub-admins', subAdminRoutes);
app.use('/api/admin/archived-accounts', archivedAccountRoutes);
app.use('/api/admin/pages', cmsPageRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/notifications', require('./routes/userNotification.routes'));
app.use('/api/notifications', require('./routes/pushToken.routes'));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;
