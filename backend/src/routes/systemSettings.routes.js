const express = require('express');
const router = express.Router();
const systemSettingsController = require('../controllers/systemSettings.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const operationalData = require('../controllers/operationalData.controller');

router.use(protect, authorize('admin'));

const businessLogoUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'userLogo', maxCount: 1 },
  { name: 'providerLogo', maxCount: 1 },
  { name: 'transporterLogo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
]);

router.get('/business-setup', systemSettingsController.getBusinessSetup);
router.put('/business-setup', businessLogoUpload, systemSettingsController.updateBusinessSetup);
router.get('/customization', systemSettingsController.getCustomization);
router.put('/customization', systemSettingsController.updateCustomization);

router.get('/developer', systemSettingsController.getDeveloperSettings);
router.put('/developer', systemSettingsController.updateDeveloperSettings);
router.get('/developer/operational-data', operationalData.operationalCounts);
router.post('/developer/clear-operational-data', operationalData.clearOperationalData);

module.exports = router;
