const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

console.log('Initializing Cloudinary with:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'MISSING',
    api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'MISSING'
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware to generate and store teamId
const generateTeamIdMiddleware = (req, res, next) => {
    // Generate or use existing teamId for file naming
    const timestamp = Date.now();
    req.uploadTimestamp = timestamp;
    next();
};

// Storage for payment screenshots (Memory Storage for background upload)
const memoryStorage = multer.memoryStorage();

const uploadScreenshot = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Storage for QR codes (admin uploads)
const qrCodeStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'createx_hackathon/qrcodes',
            allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
            resource_type: 'auto',
            public_id: `qr_${Date.now()}`
        };
    }
});

const uploadQRCode = multer({
    storage: qrCodeStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = { cloudinary, uploadScreenshot, uploadQRCode, generateTeamIdMiddleware };
