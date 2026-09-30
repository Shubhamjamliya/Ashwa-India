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
const marketplaceRoutes = require('./routes/marketplace.routes');
const storeRoutes = require('./routes/store.routes');
const adminRoutes = require('./routes/admin.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes');
const systemSettingsRoutes = require('./routes/systemSettings.routes');
const subAdminRoutes = require('./routes/subAdmin.routes');
const archivedAccountRoutes = require('./routes/archivedAccount.routes');
const cmsPageRoutes = require('./routes/cmsPage.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
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

app.use('/api/uploads', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/transporters', transporterRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin/system-settings', systemSettingsRoutes);
app.use('/api/admin/sub-admins', subAdminRoutes);
app.use('/api/admin/archived-accounts', archivedAccountRoutes);
app.use('/api/admin/pages', cmsPageRoutes);
app.use('/api/admin/notifications', notificationRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;
