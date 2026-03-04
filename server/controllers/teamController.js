const Team = require('../models/Team');
const Counter = require('../models/Counter');
const generateTeamId = require('../utils/generateId');
const { Parser } = require('json2csv');
const Setting = require('../models/Setting');
const { sendRegistrationEmail, sendPaymentVerificationEmail } = require('../utils/email');
const { cloudinary } = require('../utils/cloudinary');

const getLimit = async () => {
    const setting = await Setting.findOne({ key: 'registrationLimit' });
    return setting ? parseInt(setting.value) : 75; // Default to 75
};

// Get Public Status
exports.getStats = async (req, res) => {
    try {
        // Clean up expired drafts before calculating stats
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        await Team.deleteMany({ 'payment.status': 'Draft', createdAt: { $lt: tenMinsAgo } });

        const totalTeams = await Team.countDocuments({ 'payment.status': { $in: ['Pending', 'Verified', 'Completed'] } }); // Count actual intended teams
        const limit = await getLimit();
        const stoppedSetting = await Setting.findOne({ key: 'registrationStopped' });

        const isStopped = stoppedSetting && stoppedSetting.value === 'true' ? true : false;
        const limitReached = totalTeams >= limit;
        const isRegistrationOpen = !limitReached && !isStopped;

        res.json({
            totalTeams,
            limit,
            isRegistrationOpen,
            isStopped,
            limitReached
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Check Team Name Availability
exports.checkTeamName = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const existingTeam = await Team.findOne({
            teamName: { $regex: `^${name}$`, $options: 'i' }
        });

        res.json({ available: !existingTeam });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createDraft = async (req, res) => {
    try {
        const { teamName, leader, members } = req.body;

        const [count, limit, stoppedSetting, existingTeam] = await Promise.all([
            Team.countDocuments({ 'payment.status': { $in: ['Pending', 'Verified', 'Completed'] } }),
            getLimit(),
            Setting.findOne({ key: 'registrationStopped' }),
            Team.findOne({ teamName: { $regex: `^${teamName}$`, $options: 'i' } })
        ]);

        const isStopped = stoppedSetting && stoppedSetting.value === 'true';

        if (isStopped) {
            return res.status(400).json({ message: 'Registration stopped by the admin contact admin for information' });
        }

        if (count >= limit) {
            return res.status(400).json({ message: 'Registrations closed due to completing of slots' });
        }

        if (existingTeam) {
            return res.status(400).json({ message: 'Team name already exists. Please choose a different team name.' });
        }

        const teamId = 'DRAFT-' + Date.now().toString() + '-' + Math.floor(Math.random() * 1000);

        const leaderData = typeof leader === 'string' ? JSON.parse(leader) : leader;
        const membersData = typeof members === 'string' ? JSON.parse(members) : members;

        const newTeam = new Team({
            teamId,
            teamName,
            leader: leaderData,
            members: membersData || [],
            payment: {
                utr: 'DRAFT',
                screenshotUrl: 'DRAFT',
                status: 'Draft'
            }
        });

        await newTeam.save();

        res.status(201).json({ message: 'Draft created, reserved slot for 10 minutes', teamId });
    } catch (err) {
        console.error('DRAFT ERROR:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Participant Registration (Finalize Draft)
exports.registerTeam = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Payment screenshot is required' });
        }

        const { teamId, utr } = req.body;

        if (!teamId) {
            return res.status(400).json({ message: 'Team ID is missing. Please start registration from the beginning.' });
        }

        const team = await Team.findOne({ teamId });
        if (!team || team.payment.status !== 'Draft') {
            return res.status(400).json({ message: 'Registration session expired or invalid. Please try again.' });
        }

        const existingUTR = await Team.findOne({ 'payment.utr': utr, teamId: { $ne: teamId } });

        if (existingUTR) {
            return res.status(400).json({ message: 'UTR already exists. Please enter a different UTR number.' });
        }

        // Generate the real sequential ID only now (post-payment config)
        const realTeamId = await generateTeamId();

        team.teamId = realTeamId;
        team.payment.utr = utr;
        team.payment.status = 'Pending';
        const teamName = team.teamName;

        // === UPLOAD SCREENSHOT FIRST ===
        const uploadScreenshotToCloudinary = () => {
            return new Promise((resolve, reject) => {
                const newPublicId = `${realTeamId}-${teamName}`;
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'createx_hackathon/screenshots',
                        public_id: newPublicId,
                        resource_type: 'auto'
                    },
                    (error, result) => {
                        if (error) {
                            console.error(`Upload failed for ${realTeamId}:`, error);
                            return reject(error);
                        }
                        if (result && result.secure_url) {
                            resolve(result.secure_url);
                        } else {
                            reject(new Error("No URL returned from Cloudinary"));
                        }
                    }
                );
                const streamifier = require('streamifier');
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
        };

        try {
            const secureUrl = await uploadScreenshotToCloudinary();
            team.payment.screenshotUrl = secureUrl;
            console.log(`Upload successful for ${realTeamId}, updated URL.`);
        } catch (err) {
            console.error('Cloudinary upload error:', err);
            team.payment.screenshotUrl = 'UPLOAD_FAILED';
        }

        await team.save();

        // 3. Send Registration Email
        const leadEmail = team.leader.email;
        const leadName = team.leader.name;
        const membersData = team.members;

        if (leadEmail) {
            try {
                const result = await sendRegistrationEmail(realTeamId, teamName, leadEmail, leadName, membersData);
                if (result.success) console.log(`Email sent to ${leadEmail}`);
                else console.error(`Email failed for ${leadEmail}:`, result.error);
            } catch (err) {
                console.error('Email critical error:', err);
            }
        }

        // Send Response After all work is complete
        res.status(201).json({ message: 'Registration successful', teamId: realTeamId });
    } catch (err) {
        console.error('REGISTRATION ERROR:', err.message);
        if (err.errors) console.error('VALIDATION DETAILS:', JSON.stringify(err.errors, null, 2));
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Admin Override Registration
exports.adminCreateTeam = async (req, res) => {
    try {
        // No limit check here
        if (!req.file) {
            return res.status(400).json({ message: 'Payment screenshot is required' });
        }

        const { teamName, leader, members, utr } = req.body;

        // Check if team name already exists (case-insensitive)
        const existingTeam = await Team.findOne({
            teamName: { $regex: `^${teamName}$`, $options: 'i' }
        });
        if (existingTeam) {
            return res.status(400).json({ message: 'Team name already exists. Please choose a different team name.' });
        }

        // Check if UTR already exists
        const existingUTR = await Team.findOne({
            'payment.utr': utr
        });
        if (existingUTR) {
            return res.status(400).json({ message: 'UTR already exists. Please enter a different UTR number.' });
        }

        const leaderData = typeof leader === 'string' ? JSON.parse(leader) : leader;
        const membersData = typeof members === 'string' ? JSON.parse(members) : members;

        const teamId = await generateTeamId();

        // === UPLOAD SCREENSHOT FIRST ===
        const uploadScreenshotToCloudinary = () => {
            return new Promise((resolve, reject) => {
                const newPublicId = `${teamId}-${teamName}`;
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'createx_hackathon/screenshots',
                        public_id: newPublicId,
                        resource_type: 'auto'
                    },
                    (error, result) => {
                        if (error) {
                            console.error(`Upload failed for Admin team ${teamId}:`, error);
                            return reject(error);
                        }
                        if (result && result.secure_url) {
                            resolve(result.secure_url);
                        } else {
                            reject(new Error("No URL returned from Cloudinary"));
                        }
                    }
                );
                const streamifier = require('streamifier');
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
        };

        let secureUrl = 'UPLOAD_FAILED';
        try {
            secureUrl = await uploadScreenshotToCloudinary();
            console.log(`Upload successful for Admin team ${teamId}, updated URL.`);
        } catch (err) {
            console.error('Cloudinary stream err', err);
        }

        // 1. Save team with actual Screenshot URL
        const newTeam = new Team({
            teamId,
            teamName,
            leader: leaderData,
            members: membersData || [],
            payment: {
                utr,
                screenshotUrl: secureUrl,
                status: 'Verified' // Admin added usually means verified
            },
            isAdminOverride: true
        });

        await newTeam.save();

        // 2. Respond
        res.status(201).json({ message: 'Team added by Admin', teamId });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Check Payment Status (Public)
exports.checkStatus = async (req, res) => {
    const { teamId, registerNumber } = req.query;
    try {
        // Case insensitive search for inputs might be good, but strict for now
        const team = await Team.findOne({
            teamId,
            'leader.registerNumber': registerNumber
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found with these details. Check Team ID and Leader Register Number.' });
        }
        res.json({ status: team.payment.status, reason: team.payment.rejectionReason });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Get All Teams
exports.getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find({ 'payment.status': { $ne: 'Draft' } }).sort({ createdAt: -1 });
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Verify/Reject Payment
exports.updatePaymentStatus = async (req, res) => {
    const { teamId, status, rejectionReason } = req.body;
    try {
        console.log(`\n💳 === UPDATE PAYMENT STATUS REQUEST ===`);
        console.log(`Team ID: ${teamId}`);
        console.log(`New Status: ${status}`);

        const team = await Team.findOne({ teamId });
        if (!team) {
            console.log(`❌ Team not found: ${teamId}`);
            return res.status(404).json({ message: 'Team not found' });
        }

        console.log(`✓ Found team: ${team.teamName}`);
        console.log(`Current payment status: ${team.payment.status}`);

        // Update status
        team.payment.status = status;
        if (status === 'Rejected') {
            team.payment.rejectionReason = rejectionReason;
        } else {
            team.payment.rejectionReason = "";
        }

        // === SEND EMAIL BEFORE RESPONDING ===
        const leadEmail = team.leader.email;
        const leadName = team.leader.name;
        let emailSentSuccess = false;

        if (leadEmail) {
            console.log(`📨 Sending payment verification email to ${leadEmail}...`);
            try {
                const emailResult = await sendPaymentVerificationEmail(teamId, team.teamName, leadEmail, leadName, status);
                if (emailResult && emailResult.success) {
                    team.payment.emailSent = true;
                    team.payment.emailSentAt = new Date();
                    emailSentSuccess = true;
                    console.log(`✅ Email marked as sent in DB`);
                } else {
                    console.error(`❌ Email send failed`);
                }
            } catch (err) {
                console.error(`\n EMAIL EXCEPTION:`, err);
            }
        }

        // Save status and email status
        await team.save();
        console.log(`✓ Team saved successfully`);

        const response = {
            message: `Team ${status}${emailSentSuccess ? ' (Email sent)' : ' (Email failed)'}`,
            team,
            emailSent: emailSentSuccess
        };

        console.log(`\n✓ === UPDATE PAYMENT STATUS COMPLETE ===\n`);
        res.json(response);
    } catch (err) {
        console.error(`\n🔥 === ERROR IN UPDATE PAYMENT STATUS ===`);
        console.error(`Error: ${err.message}`);
        console.error(`Stack: ${err.stack}`);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Resend payment verification email
exports.resendPaymentEmail = async (req, res) => {
    const { teamId } = req.params;
    try {
        console.log(`\n📧 === RESEND EMAIL REQUEST ===`);
        console.log(`Team ID: ${teamId}`);

        const team = await Team.findOne({ teamId });
        if (!team) {
            console.log(`❌ Team not found: ${teamId}`);
            return res.status(404).json({ message: 'Team not found' });
        }

        console.log(`✓ Team found: ${team.teamName}`);

        const leadEmail = team.leader.email;
        const leadName = team.leader.name;
        const currentStatus = team.payment.status;

        console.log(`Lead: ${leadName}`);
        console.log(`Email: ${leadEmail}`);
        console.log(`Current Status: ${currentStatus}`);

        if (!leadEmail) {
            console.log(`❌ No email found for team`);
            return res.status(400).json({ message: 'Team leader email not available' });
        }

        try {
            console.log(`📨 Calling sendPaymentVerificationEmail...`);
            const emailSent = await sendPaymentVerificationEmail(teamId, team.teamName, leadEmail, leadName, currentStatus);

            console.log(`\n📨 Email function returned: ${emailSent} (type: ${typeof emailSent})`);

            // FIXED: Check for object property success, not strict boolean true
            if (emailSent && emailSent.success) {
                console.log(`✅ Email send successful!`);
                // Mark email as sent
                team.payment.emailSent = true;
                team.payment.emailSentAt = new Date();

                console.log(`💾 Saving team...`);
                await team.save();
                console.log(`✓ Team saved with emailSent=${team.payment.emailSent}`);
                console.log(`✓ emailSentAt=${team.payment.emailSentAt}`);

                console.log(`\n✓ === RESEND EMAIL COMPLETE ===\n`);
                res.json({ message: 'Email resent successfully', team, emailSent: true });
            } else {
                console.log(`❌ Email send failed - function returned: ${emailSent}`);
                team.payment.emailSent = false;
                await team.save();
                res.status(500).json({ message: 'Failed to send email', emailSent: false });
            }
        } catch (emailErr) {
            console.error(`\n🔥 === EXCEPTION IN EMAIL SEND ===`);
            console.error(`Error Name: ${emailErr.name}`);
            console.error(`Error Message: ${emailErr.message}`);
            console.error(`Error Code: ${emailErr.code}`);
            console.error(`Stack: ${emailErr.stack}`);
            res.status(500).json({ message: 'Failed to send email', error: emailErr.message, emailSent: false });
        }
    } catch (err) {
        console.error(`\n🔥 === OUTER ERROR IN RESEND EMAIL ===`);
        console.error(`Error: ${err.message}`);
        console.error(`Stack: ${err.stack}`);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Admin: Update Limit
exports.updateLimit = async (req, res) => {
    const { limit } = req.body;
    try {
        await Setting.findOneAndUpdate(
            { key: 'registrationLimit' },
            { value: limit },
            { upsert: true, new: true }
        );
        res.json({ message: 'Limit updated', limit });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Toggle Registration Status
exports.toggleRegistration = async (req, res) => {
    const { isStopped } = req.body;
    try {
        await Setting.findOneAndUpdate(
            { key: 'registrationStopped' },
            { value: isStopped ? 'true' : 'false' },
            { upsert: true, new: true }
        );
        res.json({ message: `Registration ${isStopped ? 'stopped' : 'opened'}` });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Delete Team
exports.deleteTeam = async (req, res) => {
    const { teamId } = req.params;
    try {
        const team = await Team.findOneAndDelete({ teamId });
        if (!team) return res.status(404).json({ message: 'Team not found' });
        res.json({ message: 'Team deleted successfully', teamId });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Delete All Teams
exports.deleteAllTeams = async (req, res) => {
    try {
        await Team.deleteMany({});
        // Reset the counter so team IDs start from 1 again
        await Counter.deleteMany({});
        // Reset limit or other settings if needed, but for now just teams.
        // We might want to keep settings, so just deleting Team collection content.
        res.json({ message: 'All teams deleted successfully and team numbering reset to 1' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Export All Details (Participant-based Row Structure)
exports.exportAllDetails = async (req, res) => {
    try {
        const teams = await Team.find({ 'payment.status': { $ne: 'Draft' } }).sort({ createdAt: -1 });
        const rows = [];

        teams.forEach(team => {
            if (!team) return;
            // Common Data for all participants in this team
            const commonData = {
                'Team ID': team.teamId || '',
                'Team Name': team.teamName || '',
                'Payment Status': team.payment?.status || '',
                'Amount': team.payment?.amount || '',
                'UTR': team.payment?.utr || '',
                'Screenshot URL': team.payment?.screenshotUrl || '',
                'Registration Date': team.createdAt ? new Date(team.createdAt).toLocaleString() : '',
            };

            // Add Leader Row
            if (team.leader) {
                rows.push({
                    ...commonData,
                    'Role': 'Team Lead',
                    'Name': team.leader.name || '',
                    'Email': team.leader.email || '',
                    'Phone': team.leader.mobileNumber || '',
                    'RegNo': team.leader.registerNumber || '',
                    'Details': `Dept: ${team.leader.department || '-'}, Year: ${team.leader.yearOfStudy || '-'}, Gender: ${team.leader.gender || '-'}, Acc: ${team.leader.isHosteler ? 'Hosteller' : 'Day Scholar'}`,
                    'Department': team.leader.department || '',
                    'Year': team.leader.yearOfStudy || '',
                    'Gender': team.leader.gender || '',
                    'Accommodation': team.leader.isHosteler ? 'Hosteller' : 'Day Scholar',
                    'Hostel': team.leader.hostelName || '',
                    'Room': team.leader.roomNumber || '',
                });
            }

            // Add Member Rows
            if (team.members && Array.isArray(team.members)) {
                team.members.forEach(member => {
                    rows.push({
                        ...commonData,
                        'Role': 'Member',
                        'Name': member.name || '',
                        'Email': member.email || '',
                        'Phone': member.mobileNumber || '',
                        'RegNo': member.registerNumber || '',
                        'Details': `Dept: ${member.department || '-'}, Year: ${member.yearOfStudy || '-'}, Gender: ${member.gender || '-'}, Acc: ${member.isHosteler ? 'Hosteller' : 'Day Scholar'}`,
                        'Department': member.department || '',
                        'Year': member.yearOfStudy || '',
                        'Gender': member.gender || '',
                        'Accommodation': member.isHosteler ? 'Hosteller' : 'Day Scholar',
                        'Hostel': member.hostelName || '',
                        'Room': member.roomNumber || '',
                    });
                });
            }
        });

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No data to export' });
        }

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(rows);

        res.header('Content-Type', 'text/csv');
        res.attachment(`createx_all_data_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (err) {
        console.error('Export All Details Error:', err);
        res.status(500).json({ message: 'Export failed' });
    }
};

// Export Screenshot Details (Simplified)
exports.exportScreenshotDetails = async (req, res) => {
    try {
        const teams = await Team.find({ 'payment.status': { $ne: 'Draft' } }).select('teamId teamName payment.screenshotUrl payment.status');

        const rows = teams.map(team => ({
            'Team ID': team.teamId,
            'Team Name': team.teamName,
            'Screenshot URL': team.payment.screenshotUrl || 'No Screenshot',
            'Status': team.payment.status
        }));

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(rows);

        res.header('Content-Type', 'text/csv');
        res.attachment(`createx_payment_proofs_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (err) {
        console.error('Export Screenshot Details Error:', err);
        res.status(500).json({ message: 'Export failed' });
    }
};

// Get Payment Settings (QR Code & UPI ID)
exports.getPaymentSettings = async (req, res) => {
    try {
        const qrSetting = await Setting.findOne({ key: 'paymentQR' });
        const upiSetting = await Setting.findOne({ key: 'upiId' });

        console.log('Fetched settings:', { qrCode: !!qrSetting, upi: !!upiSetting });

        res.json({
            qrCodeUrl: qrSetting?.value || null,
            upiId: upiSetting?.value || null
        });
    } catch (err) {
        console.error('Error fetching payment settings:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// Update Payment Settings (QR Code & UPI ID)
exports.updatePaymentSettings = async (req, res) => {
    try {
        console.log('=== UPDATE PAYMENT SETTINGS ===');
        console.log('Auth Admin:', req.admin);
        console.log('Headers:', {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            contentType: req.headers['content-type']
        });
        console.log('Body:', req.body);
        console.log('File:', req.file ? { name: req.file.filename, path: req.file.path, size: req.file.size } : 'NO FILE');

        const { upiId } = req.body;
        const qrCodeUrl = req.file ? req.file.path : null;

        // Check if at least one field is being updated
        if (!qrCodeUrl && !upiId) {
            console.log('No data provided - returning error');
            return res.status(400).json({ message: 'Please upload a QR code or enter a UPI ID' });
        }

        // Update QR Code if provided
        if (qrCodeUrl) {
            console.log('Updating QR Code:', qrCodeUrl);
            const result = await Setting.findOneAndUpdate(
                { key: 'paymentQR' },
                { value: qrCodeUrl },
                { upsert: true, new: true }
            );
            console.log('QR Code updated:', result);
        }

        // Update UPI ID if provided
        if (upiId) {
            console.log('Updating UPI ID:', upiId);
            const result = await Setting.findOneAndUpdate(
                { key: 'upiId' },
                { value: upiId },
                { upsert: true, new: true }
            );
            console.log('UPI ID updated:', result);
        }

        console.log('Settings update successful');
        res.json({ message: 'Payment settings updated successfully' });
    } catch (err) {
        console.error('Error in updatePaymentSettings:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};




