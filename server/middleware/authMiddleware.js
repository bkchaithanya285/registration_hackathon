const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        console.error('No token found');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully:', decoded);
        req.admin = decoded;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
