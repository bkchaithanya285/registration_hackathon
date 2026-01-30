const Team = require('../models/Team');
const generateTeamId = require('../utils/generateId');
const { Parser } = require('json2csv');
const Setting = require('../models/Setting');
const { sendRegistrationEmail, sendPaymentVerificationEmail } = require('../utils/email');
const { exportAllDetails, exportScreenshotDetails } = require('../utils/exportExcel');
const { cloudinary } = require('../utils/cloudinary');

const getLimit = async () => {
    const setting = await Setting.findOne({ key: 'registrationLimit' });
    return setting ? parseInt(setting.value) : 75; // Default to 75
};

// Get Public Status
exports.getStats = async (req, res) => {
    try {
        const verifiedTeams = await Team.countDocuments({ 'payment.status': 'Verified' });
        const limit = await getLimit();
        const isRegistrationOpen = verifiedTeams < limit;
        res.json({ totalTeams: verifiedTeams, isRegistrationOpen, limit });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Participant Registration
exports.registerTeam = async (req, res) => {
    try {
        const count = await Team.countDocuments();
        const limit = await getLimit();
        if (count >= limit) {
            return res.status(400).json({ message: 'Registration closed. Please contact CSI organizers.' });
        }

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

        // Parse JSON strings if they come as form-data strings
        const leaderData = typeof leader === 'string' ? JSON.parse(leader) : leader;
        const membersData = typeof members === 'string' ? JSON.parse(members) : members;

        if (!membersData || membersData.length !== 4) {
            return res.status(400).json({ message: 'Team must have exactly 5 participants (1 Lead + 4 Members)' });
        }

        const teamId = await generateTeamId();

        // Use original upload path initially for speed
        const originalScreenshotUrl = req.file.path;

        const newTeam = new Team({
            teamId,
            teamName,
            leader: leaderData,
            members: membersData || [],
            payment: {
                utr,
                screenshotUrl: originalScreenshotUrl,
                status: 'Pending'
            }
        });

        await newTeam.save();

        // 1. Send Immediate Response to Client
        res.status(201).json({ message: 'Registration successful', teamId });

        // === START BACKGROUND TASKS ===

        // 2. Background: Rename Screenshot on Cloudinary
        const timestamp = req.uploadTimestamp || Date.now();

        // CRITICAL FIX: Use the actual filename (public_id) from the upload result
        const oldPublicId = req.file.filename;
        const newPublicId = `genesis_hackathon/screenshots/${teamId}-${teamName}`;

        console.log(`[DEBUG] Rename Logic: File=${oldPublicId} -> ${newPublicId}`);

        // We don't await this, it runs in background
        cloudinary.uploader.rename(oldPublicId, newPublicId)
            .then(async (result) => {
                // Return secure_url from result
                if (result && result.secure_url) {
                    await Team.updateOne({ teamId }, { 'payment.screenshotUrl': result.secure_url });
                    console.log(`Background rename successful for ${teamId}, updated URL.`);
                } else {
                    console.error(`Rename succeeded but no secure_url returned for ${teamId}`);
                }
            })
            .catch(err => {
                console.error(`Background rename failed for ${teamId}:`, err);
                // If rename fails, the original URL (pointing to oldPublicId) is still valid, so we do nothing.
            });

        // 3. Background: Send Registration Email
        const leadEmail = leaderData.email;
        const leadName = leaderData.name;

        if (leadEmail) {
            // Send email asynchronously
            sendRegistrationEmail(teamId, teamName, leadEmail, leadName, membersData)
                .then(result => {
                    if (result.success) console.log(`Background email sent to ${leadEmail}`);
                    else console.error(`Background email failed for ${leadEmail}:`, result.error);
                })
                .catch(err => console.error('Background email critical error:', err));
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
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

        // Rename the screenshot file with format: GENESIS-001-NOVA
        const timestamp = req.uploadTimestamp || Date.now();
        const oldPublicId = `genesis_hackathon/screenshots/${teamName}_${timestamp}`;
        const newPublicId = `genesis_hackathon/screenshots/${teamId}-${teamName}`;

        let screenshotUrl = req.file.path;

        try {
            await cloudinary.uploader.rename(oldPublicId, newPublicId);
            // Update the URL with the new public_id
            screenshotUrl = screenshotUrl.replace(
                `${teamName}_${timestamp}`,
                `${teamId}-${teamName}`
            );
        } catch (renameErr) {
            console.error('Failed to rename screenshot:', renameErr);
            // Continue with original URL if rename fails
        }

        const newTeam = new Team({
            teamId,
            teamName,
            leader: leaderData,
            members: membersData || [],
            payment: {
                utr,
                screenshotUrl: screenshotUrl,
                status: 'Verified' // Admin added usually means verified, but let's keep it Verified or Pending? Prompt says "Admin can manually add". let's set Verified for convenience or allow param.
            },
            isAdminOverride: true
        });

        await newTeam.save();
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
        const teams = await Team.find().sort({ createdAt: -1 });
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

        // Send payment verification email to team lead BEFORE saving
        const leadEmail = team.leader.email;
        const leadName = team.leader.name;
        let emailSentSuccess = false;

        console.log(`Team Lead: ${leadName}`);
        console.log(`Team Lead Email: ${leadEmail}`);

        if (leadEmail) {
            try {
                console.log(`📨 Calling sendPaymentVerificationEmail...`);
                const emailSent = await sendPaymentVerificationEmail(teamId, team.teamName, leadEmail, leadName, status);

                console.log(`\n📨 Email function returned: ${emailSent} (type: ${typeof emailSent})`);

                if (emailSent === true) {
                    emailSentSuccess = true;
                    team.payment.emailSent = true;
                    team.payment.emailSentAt = new Date();
                    console.log(`✅ Email marked as sent`);
                    console.log(`emailSentAt: ${team.payment.emailSentAt}`);
                } else {
                    emailSentSuccess = false;
                    team.payment.emailSent = false;
                    console.log(`⚠️  Email function returned false or falsy value`);
                }
            } catch (emailErr) {
                console.error(`\n🔥 EXCEPTION while sending email:`);
                console.error(`Message: ${emailErr.message}`);
                console.error(`Stack: ${emailErr.stack}`);
                emailSentSuccess = false;
                team.payment.emailSent = false;
            }
        } else {
            console.log(`⚠️  No email address found for team lead`);
            team.payment.emailSent = false;
        }

        // Save the team with email status
        console.log(`\n💾 Saving team...`);
        console.log(`Before save - emailSent: ${team.payment.emailSent}, emailSentAt: ${team.payment.emailSentAt}`);

        await team.save();

        console.log(`✓ Team saved successfully`);
        console.log(`After save - emailSent: ${team.payment.emailSent}, emailSentAt: ${team.payment.emailSentAt}`);

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

            if (emailSent === true) {
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
        // Reset limit or other settings if needed, but for now just teams.
        // We might want to keep settings, so just deleting Team collection content.
        res.json({ message: 'All teams deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Export to CSV (Supports Filtered IDs & Gender)
exports.exportData = async (req, res) => {
    try {
        const { ids, filters } = req.body; // Expect array of teamIds and filters object
        let teams;

        if (ids && ids.length > 0) {
            teams = await Team.find({ teamId: { $in: ids } });
        } else {
            teams = await Team.find();
        }

        const rows = [];
        const targetGender = filters?.gender || 'All'; // 'All', 'Male', 'Female'

        teams.forEach(team => {
            // Leader row
            const showLeader = targetGender === 'All' || (team.leader.gender === targetGender);

            if (showLeader) {
                rows.push({
                    TeamID: team.teamId,
                    TeamName: team.teamName,
                    Role: 'Lead',
                    Name: team.leader.name,
                    Gender: team.leader.gender || '-',
                    RegisterNumber: team.leader.registerNumber,
                    Mobile: team.leader.mobileNumber,
                    YearOfStudy: team.leader.yearOfStudy || '-',
                    Department: team.leader.department || '-',
                    Type: team.leader.isHosteler ? 'Hosteler' : 'Day Scholar',
                    Hostel: team.leader.hostelName || '-',
                    Room: team.leader.roomNumber || '-',
                    ScreenshotLink: team.payment.screenshotUrl,
                    PaymentStatus: team.payment.status
                });
            }

            // Members rows
            team.members.forEach((member, index) => {
                const showMember = targetGender === 'All' || (member.gender === targetGender);

                if (showMember) {
                    rows.push({
                        TeamID: team.teamId,
                        TeamName: team.teamName,
                        Role: `Member ${index + 2}`,
                        Name: member.name,
                        Gender: member.gender || '-',
                        RegisterNumber: member.registerNumber,
                        Mobile: member.mobileNumber,
                        YearOfStudy: member.yearOfStudy || '-',
                        Department: member.department || '-',
                        Type: member.isHosteler ? 'Hosteler' : 'Day Scholar',
                        Hostel: member.hostelName || '-',
                        Room: member.roomNumber || '-',
                        ScreenshotLink: team.payment.screenshotUrl,
                        PaymentStatus: team.payment.status
                    });
                }
            });
        });

        const fields = ['TeamID', 'TeamName', 'Role', 'Name', 'Gender', 'RegisterNumber', 'Mobile', 'YearOfStudy', 'Department', 'Type', 'Hostel', 'Room', 'ScreenshotLink', 'PaymentStatus'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(rows);

        res.header('Content-Type', 'text/csv');
        res.attachment('genesis_registrations.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Export All Team Details to CSV (Team Code, Team Name, All Info)
exports.exportAllDetails = async (req, res) => {
    try {
        const teams = await Team.find();
        const csv = await exportAllDetails(teams);

        res.header('Content-Type', 'text/csv');
        res.attachment(`genesis_all_details_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Export failed' });
    }
};

// Export Screenshot Details to CSV (Team Code, Team Name, Screenshot Link)
exports.exportScreenshotDetails = async (req, res) => {
    try {
        const teams = await Team.find();
        const csv = await exportScreenshotDetails(teams);

        res.header('Content-Type', 'text/csv');
        res.attachment(`genesis_screenshot_details_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (err) {
        console.error(err);
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

// Export with Customized Columns
exports.customExport = async (req, res) => {
    try {
        const { ids, filters, selectedColumns } = req.body;
        let teams;

        if (ids && ids.length > 0) {
            teams = await Team.find({ teamId: { $in: ids } });
        } else {
            teams = await Team.find();
        }

        const rows = [];
        const targetGender = filters?.gender || 'All';
        const targetType = filters?.type || 'All';
        const targetYear = filters?.year || 'All';
        const targetStatus = filters?.status || 'All';

        teams.forEach(team => {
            // Leader row
            const leaderGenderMatch = targetGender === 'All' || (team.leader.gender === targetGender);
            const leaderTypeMatch = targetType === 'All' || (team.leader.isHosteler ? 'Hosteler' : 'Day Scholar') === targetType;
            const leaderYearMatch = targetYear === 'All' || (team.leader.yearOfStudy === targetYear);
            const statusMatch = targetStatus === 'All' || (team.payment.status === targetStatus);

            if (leaderGenderMatch && leaderTypeMatch && leaderYearMatch && statusMatch) {
                const row = {};

                if (selectedColumns?.teamId) row['Team ID'] = team.teamId;
                if (selectedColumns?.teamName) row['Team Name'] = team.teamName;
                if (selectedColumns?.leadName) row['Lead Name'] = team.leader.name;
                if (selectedColumns?.leadRegNo) row['Lead Reg No'] = team.leader.registerNumber;
                if (selectedColumns?.leadPhone) row['Lead Phone'] = team.leader.mobileNumber;
                if (selectedColumns?.leadEmail) row['Lead Email'] = team.leader.email || '-';
                if (selectedColumns?.gender) row['Gender'] = team.leader.gender || '-';
                if (selectedColumns?.year) row['Year'] = team.leader.yearOfStudy || '-';
                if (selectedColumns?.department) row['Department'] = team.leader.department || '-';
                if (selectedColumns?.accommodation) row['Accommodation'] = team.leader.isHosteler ? 'Hosteler' : 'Day Scholar';
                if (selectedColumns?.hostel) row['Hostel'] = team.leader.hostelName || '-';
                if (selectedColumns?.room) row['Room'] = team.leader.roomNumber || '-';
                if (selectedColumns?.paymentStatus) row['Payment Status'] = team.payment.status;
                if (selectedColumns?.screenshot) row['Screenshot'] = team.payment.screenshotUrl;

                rows.push(row);
            }

            // Members rows
            team.members.forEach((member, index) => {
                const memberGenderMatch = targetGender === 'All' || (member.gender === targetGender);
                const memberTypeMatch = targetType === 'All' || (member.isHosteler ? 'Hosteler' : 'Day Scholar') === targetType;
                const memberYearMatch = targetYear === 'All' || (member.yearOfStudy === targetYear);

                if (memberGenderMatch && memberTypeMatch && memberYearMatch && statusMatch) {
                    const row = {};

                    if (selectedColumns?.teamId) row['Team ID'] = team.teamId;
                    if (selectedColumns?.teamName) row['Team Name'] = team.teamName;
                    if (selectedColumns?.memberName) row['Member Name'] = member.name;
                    if (selectedColumns?.memberRegNo) row['Member Reg No'] = member.registerNumber;
                    if (selectedColumns?.memberPhone) row['Member Phone'] = member.mobileNumber;
                    if (selectedColumns?.memberEmail) row['Member Email'] = member.email || '-';
                    if (selectedColumns?.gender) row['Gender'] = member.gender || '-';
                    if (selectedColumns?.year) row['Year'] = member.yearOfStudy || '-';
                    if (selectedColumns?.department) row['Department'] = member.department || '-';
                    if (selectedColumns?.accommodation) row['Accommodation'] = member.isHosteler ? 'Hosteler' : 'Day Scholar';
                    if (selectedColumns?.hostel) row['Hostel'] = member.hostelName || '-';
                    if (selectedColumns?.room) row['Room'] = member.roomNumber || '-';
                    if (selectedColumns?.paymentStatus) row['Payment Status'] = team.payment.status;
                    if (selectedColumns?.screenshot) row['Screenshot'] = team.payment.screenshotUrl;

                    rows.push(row);
                }
            });
        });

        const fields = Object.keys(rows[0] || {});
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(rows);

        res.header('Content-Type', 'text/csv');
        res.attachment(`genesis_custom_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Export failed' });
    }
};

// Seed Data
exports.seedData = async (req, res) => {
    try {
        await Team.deleteMany({}); // Optional: connect to empty DB
        const dummyTeams = [];
        for (let i = 1; i <= 10; i++) {
            const teamId = `GENESIS-00${i}`;
            dummyTeams.push({
                teamId,
                teamName: `Team Alpha ${i}`,
                leader: {
                    name: `Leader ${i}`,
                    registerNumber: `REG-${i}`,
                    mobileNumber: `900000000${i}`,
                    isHosteler: i % 2 === 0,
                    hostelName: i % 2 === 0 ? 'BH-1' : '',
                    roomNumber: i % 2 === 0 ? '101' : ''
                },
                members: [
                    { name: `Mem 1-${i}`, registerNumber: `R1-${i}`, mobileNumber: `000000001${i}`, isHosteler: false },
                    { name: `Mem 2-${i}`, registerNumber: `R2-${i}`, mobileNumber: `000000002${i}`, isHosteler: false },
                    { name: `Mem 3-${i}`, registerNumber: `R3-${i}`, mobileNumber: `000000003${i}`, isHosteler: false },
                    { name: `Mem 4-${i}`, registerNumber: `R4-${i}`, mobileNumber: `000000004${i}`, isHosteler: false },
                ],
                payment: {
                    amount: 1750,
                    utr: `UTR${i}0000`,
                    screenshotUrl: 'https://via.placeholder.com/150',
                    status: i % 3 === 0 ? 'Rejected' : i % 2 === 0 ? 'Verified' : 'Pending',
                    rejectionReason: i % 3 === 0 ? 'Invalid UTR' : ''
                }
            });
        }
        await Team.insertMany(dummyTeams);
        res.json({ message: 'Seeded 10 dummy teams' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Seed failed' });
    }
};

// Test Email Endpoint
exports.testEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    try {
        console.log(`Testing email to: ${email}`);
        const result = await sendRegistrationEmail(
            'TEST-ID',
            'TEST TEAM',
            email,
            'Test Leader',
            [{ name: 'Test Member', registerNumber: '123' }]
        );

        if (result) {
            res.json({ message: 'Email sent successfully via Nodemailer!' });
        } else {
            res.status(500).json({ message: 'Nodemailer returned false. Check server logs for exact error.' });
        }
    } catch (err) {
        console.error('Test Email Controller Error:', err);
        res.status(500).json({ message: 'Error triggering email', error: err.toString() });
    }
};
