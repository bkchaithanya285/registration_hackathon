const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Seed admin function (internal use)
exports.seedAdmin = async () => {
    // Check if the specific admin exists
    const adminExists = await Admin.findOne({ username: 'genesisbycsi' });

    if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('9390198225@csi', salt);

        // Optional: Remove old admin if you want to enforce only new one
        // await Admin.deleteOne({ username: 'admin' });

        await Admin.create({ username: 'genesisbycsi', password: hashedPassword });
        console.log('Admin seeded: genesisbycsi');
    } else {
        console.log('Admin already exists');
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
