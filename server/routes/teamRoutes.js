const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

const { uploadScreenshot, uploadQRCode, generateTeamIdMiddleware } = require('../utils/cloudinary');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to handle multer errors
const handleUploadError = (uploadFn) => {
    return (req, res, next) => {
        uploadFn(req, res, (err) => {
            if (err) {
                console.error('=== MULTER UPLOAD ERROR ===');
                console.error('Error message:', err.message);
                console.error('Error code:', err.code);
                console.error('Error details:', err);
                return res.status(400).json({ message: 'File upload failed: ' + err.message });
            }
            console.log('File upload passed multer successfully');
            next();
        });
    };
};

router.get('/stats', teamController.getStats);
// Public endpoint to get payment settings (for registration page)
router.get('/payment-settings', async (req, res) => {
    try {
        const Setting = require('../models/Setting');
        const qrSetting = await Setting.findOne({ key: 'paymentQR' });
        const upiSetting = await Setting.findOne({ key: 'upiId' });
        res.json({
            qrCodeUrl: qrSetting?.value || null,
            upiId: upiSetting?.value || null
        });
    } catch (err) {
        console.error('Error fetching payment settings:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});
router.get('/check-name', teamController.checkTeamName);
router.post('/reserve', teamController.createDraft);
router.post('/register', generateTeamIdMiddleware, uploadScreenshot.single('screenshot'), teamController.registerTeam);
router.get('/status', teamController.checkStatus);

// Admin Routes - Allow both JWT token and access code
router.post('/admin/register', authMiddleware, generateTeamIdMiddleware, uploadScreenshot.single('screenshot'), teamController.adminCreateTeam);
router.get('/admin/teams', authMiddleware, teamController.getAllTeams);
router.put('/admin/verify', authMiddleware, teamController.updatePaymentStatus);
router.put('/admin/limit', authMiddleware, teamController.updateLimit);
router.put('/admin/toggleRegistration', authMiddleware, teamController.toggleRegistration);
router.delete('/admin/team/:teamId', authMiddleware, teamController.deleteTeam);
router.delete('/admin/clear-all', authMiddleware, teamController.deleteAllTeams);
// Export Routes
router.get('/admin/export/all-details', authMiddleware, teamController.exportAllDetails);
router.get('/admin/export/screenshot-details', authMiddleware, teamController.exportScreenshotDetails);

// Payment Settings Routes
router.get('/admin/settings/payment', authMiddleware, teamController.getPaymentSettings);
router.put('/admin/settings/payment', authMiddleware, handleUploadError(uploadQRCode.single('qrCode')), teamController.updatePaymentSettings);

// Resend payment verification email
router.post('/admin/resend-email/:teamId', authMiddleware, teamController.resendPaymentEmail);


module.exports = router;
