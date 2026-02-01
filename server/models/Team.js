const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registerNumber: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  yearOfStudy: { type: String, required: true },
  department: { type: String, required: true },
  isHosteler: { type: Boolean, required: true },
  hostelName: { type: String },
  roomNumber: { type: String },
  role: { type: String, enum: ['Leader', 'Member'], default: 'Member' }
});

const teamSchema = new mongoose.Schema({
  teamId: { type: String, unique: true, required: true },
  teamName: { type: String, required: true },
  leader: { type: memberSchema, required: true },
  members: [memberSchema], // Additional members
  payment: {
    amount: { type: Number, default: 1750 },
    utr: { type: String, required: true },
    screenshotUrl: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    rejectionReason: { type: String },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date }
  },
  isAdminOverride: { type: Boolean, default: false },
}, { timestamps: true });

// Add indexes for frequently queried fields
teamSchema.index({ teamName: 1 });
teamSchema.index({ 'payment.utr': 1 });

module.exports = mongoose.model('Team', teamSchema);
