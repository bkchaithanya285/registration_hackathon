const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Seed admin function (internal use)
exports.seedAdmin = async () => {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        console.log('Admin password not set in .env, skipping seed');
        return;
    }

    // 1. Remove legacy admins including specific ones we've used before
    await Admin.deleteMany({ username: { $in: ['admin', 'genesisbycsi', 'createxbycsi'] } });

    // 2. Check if the specific new admin exists (extra safety)
    const adminExists = await Admin.findOne({ username: adminUsername });

    if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        await Admin.create({ username: adminUsername, password: hashedPassword });
        console.log(`Admin seeded: ${adminUsername} (and legacy admins removed)`);
    } else {
        console.log(`Admin ${adminUsername} already exists (legacy admins removed)`);
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, admin: { id: admin._id, username: admin.username } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
