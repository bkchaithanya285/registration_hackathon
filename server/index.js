require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const teamRoutes = require('./routes/teamRoutes');
const authRoutes = require('./routes/authRoutes');
const { seedAdmin } = require('./controllers/authController');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);

app.get('/', (req, res) => {
    res.send('GENESIS Hackathon API Running');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Server error',
        status: err.status || 500
    });
});

const PORT = process.env.PORT || 5000;

console.log('Mongo URI:', process.env.MONGO_URI); // Debugging

mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/genesis_hackathon")
    .then(async () => {
        console.log('MongoDB Connected');
        await seedAdmin();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.log(err));
