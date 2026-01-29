const checkAccessCode = (req, res, next) => {
    const code = req.header('x-access-code');
    if (code !== process.env.ADMIN_ACCESS_CODE) {
        return res.status(403).json({ message: 'Invalid Access Code' });
    }
    next();
};

module.exports = checkAccessCode;
