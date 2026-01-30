const nodemailer = require('nodemailer');

// Create transporter using Gmail (you can modify this for other email services)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('Email service error:', error);
    } else {
        console.log('Email service is ready to send messages');
    }
});

/**
 * Send registration confirmation email to team lead
 */
/**
 * Send registration confirmation email to team lead
 */
const sendRegistrationEmail = async (teamId, teamName, leadEmail, leadName, members) => {
    try {
        console.log(`\n📧 === SENDING REGISTRATION EMAIL ===`);
        console.log(`To: ${leadEmail}`);
        console.log(`Team: ${teamName} (${teamId})`);

        const membersListHtml = members.map((m, idx) => `
            <tr>
                <td style="padding: 8px 10px; color: #e9d5ff;">${idx + 1}. ${m.name}</td>
                <td style="padding: 8px 10px; color: #e9d5ff; font-family: monospace;">${m.registerNumber}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@genesis.com',
            to: leadEmail,
            subject: `🎉 Registration Received - Team ID: ${teamId}`,
            html: `
                <div style="font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a0f0f 50%, #0a0a0a 100%); padding: 20px; color: #fff;">
                    <div style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(220, 38, 38, 0.3); border-radius: 20px; padding: 40px; backdrop-filter: blur(10px);">
                        <h1 style="color: #ef4444; text-align: center; font-size: 28px; margin-bottom: 20px;">🚀 Welcome to GENESIS</h1>
                        
                        <div style="background: rgba(236, 72, 153, 0.1); border-left: 4px solid #ec4899; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h2 style="color: #ec4899; margin-top: 0;">Registration Received!</h2>
                            <p style="font-size: 16px; line-height: 1.6; margin: 10px 0;">Dear <strong>${leadName}</strong>,</p>
                            <p style="font-size: 14px; line-height: 1.8;">Thank you for registering your team for GENESIS! We have received your details and payment screenshot.</p>
                        </div>

                        <div style="background: rgba(139, 92, 246, 0.1); border: 2px solid rgba(168, 85, 247, 0.3); padding: 20px; border-radius: 12px; margin: 20px 0;">
                            <h3 style="color: #a855f7; margin-top: 0;">📋 Team Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; font-weight: bold; color: #d8b4fe;">Team Name:</td>
                                    <td style="padding: 10px; color: #e9d5ff;">${teamName}</td>
                                </tr>
                                <tr style="background: rgba(139, 92, 246, 0.05);">
                                    <td style="padding: 10px; font-weight: bold; color: #d8b4fe;">Team ID:</td>
                                    <td style="padding: 10px; color: #e9d5ff; font-size: 18px; letter-spacing: 2px;"><strong>${teamId}</strong></td>
                                </tr>
                            </table>
                            
                            <div style="margin-top: 15px;">
                                <h4 style="color: #d8b4fe; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">👥 Team Members</h4>
                                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                    ${membersListHtml}
                                </table>
                            </div>
                        </div>

                        <div style="background: rgba(249, 115, 22, 0.1); border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #fb923c; margin-top: 0;">⏭️ What Happens Next?</h3>
                            <p style="color: #fed7aa; line-height: 1.8; margin-bottom: 15px;">
                                Your payment is currently being processed. Please wait for our admin team to verify your transaction.
                            </p>
                            <ul style="color: #fed7aa; line-height: 1.8;">
                                <li><strong>Check Portal:</strong> You can check your status on the registration portal.</li>
                                <li><strong>Email Notification:</strong> We will send you a confirmation email once your payment is verified (Approved/Rejected).</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                                If you have any questions, please reply to this email or contact our support team.
                            </p>
                            <p style="color: #6b7280; font-size: 11px; margin: 10px 0;">
                                © 2026 GENESIS. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✓ SUCCESSFULLY sent to ${leadEmail}`);
        return { success: true, result };
    } catch (error) {
        console.error(`\n🔥 === FAILED TO SEND REGISTRATION EMAIL ===`);
        console.error(`To: ${leadEmail}`);
        console.error(`Error:`, error.message);
        return { success: false, error: error };
    }
};

/**
 * Send payment verification email to team lead
 */
const sendPaymentVerificationEmail = async (teamId, teamName, leadEmail, leadName, paymentStatus) => {
    try {
        const isApproved = paymentStatus === 'Verified';
        const statusColor = isApproved ? '#22c55e' : '#ef4444';
        const statusIcon = isApproved ? '✅' : '❌';
        const statusMessage = isApproved ? 'APPROVED' : 'REJECTED';

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@genesis.com',
            to: leadEmail,
            subject: `${statusIcon} Payment ${statusMessage} - Team ID: ${teamId}`,
            html: `
                <div style="font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a0f0f 50%, #0a0a0a 100%); padding: 20px; color: #fff;">
                    <div style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(${isApproved ? '34, 197, 94' : '220, 38, 38'}, 0.3); border-radius: 20px; padding: 40px; backdrop-filter: blur(10px);">
                        <h1 style="color: ${statusColor}; text-align: center; font-size: 28px; margin-bottom: 20px;">${statusIcon} Payment ${statusMessage}</h1>
                        
                        <div style="background: rgba(${isApproved ? '34, 197, 94' : '220, 38, 38'}, 0.1); border-left: 4px solid ${statusColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h2 style="color: ${statusColor}; margin-top: 0;">Dear ${leadName},</h2>
                            <p style="font-size: 16px; line-height: 1.6;">
                                ${isApproved
                    ? `Your payment has been <strong>VERIFIED</strong> and <strong>APPROVED</strong>! Your team is now officially registered for GENESIS.`
                    : `Your payment submission has been <strong>REJECTED</strong>. Please review the payment details and resubmit.`
                }
                            </p>
                        </div>

                        <div style="background: rgba(139, 92, 246, 0.1); border: 2px solid rgba(168, 85, 247, 0.3); padding: 20px; border-radius: 12px; margin: 20px 0;">
                            <h3 style="color: #a855f7; margin-top: 0;">📋 Team Information</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; font-weight: bold; color: #d8b4fe;">Team Name:</td>
                                    <td style="padding: 10px; color: #e9d5ff;">${teamName}</td>
                                </tr>
                                <tr style="background: rgba(139, 92, 246, 0.05);">
                                    <td style="padding: 10px; font-weight: bold; color: #d8b4fe;">Team ID:</td>
                                    <td style="padding: 10px; color: #e9d5ff; font-size: 18px; letter-spacing: 2px;"><strong>${teamId}</strong></td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-weight: bold; color: #d8b4fe;">Payment Status:</td>
                                    <td style="padding: 10px; color: ${statusColor}; font-weight: bold; font-size: 16px;">${statusMessage}</td>
                                </tr>
                                <tr style="background: rgba(139, 92, 246, 0.05);">
                                    <td style="padding: 10px; font-weight: bold; color: #d8b4fe;">Verification Date:</td>
                                    <td style="padding: 10px; color: #e9d5ff;">${new Date().toLocaleDateString()}</td>
                                </tr>
                            </table>
                        </div>

                        ${isApproved ? `
                        <div style="background: rgba(34, 197, 94, 0.1); border: 2px solid rgba(34, 197, 94, 0.3); padding: 20px; border-radius: 12px; margin: 20px 0;">
                            <h3 style="color: #86efac; margin-top: 0;">What's Next?</h3>
                            <ul style="color: #dcfce7; line-height: 1.8; font-size: 14px;">
                                <li>Your team is now officially registered!</li>
                                <li>You'll receive further updates about the event schedule</li>
                                <li>Make sure all team members are prepared for the hackathon</li>
                                <li>Check the portal regularly for any updates or announcements</li>
                            </ul>
                        </div>

                        <div style="background: rgba(37, 211, 102, 0.15); border: 2px solid rgba(37, 211, 102, 0.4); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                            <h3 style="color: #25D366; margin-top: 0;">Join Our WhatsApp Group</h3>
                            <p style="color: #dcfce7; line-height: 1.8; font-size: 14px; margin: 10px 0;">
                                <strong>Joining the WhatsApp group is COMPULSORY</strong> for event updates and important announcements.
                            </p>
                            <p style="margin: 15px 0;">
                                <a href="https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t" style="display: inline-block; background-color: #25D366; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                    Join WhatsApp Group
                                </a>
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                                Or copy this link: https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t
                            </p>
                        </div>
                        ` : `
                        <div style="background: rgba(220, 38, 38, 0.1); border: 2px solid rgba(220, 38, 38, 0.3); padding: 20px; border-radius: 12px; margin: 20px 0;">
                            <h3 style="color: #fca5a5; margin-top: 0;">Action Required</h3>
                            <p style="color: #fecaca; line-height: 1.8; font-size: 14px;">
                                Please submit a valid payment screenshot and try again. Make sure the screenshot clearly shows:
                            </p>
                            <ul style="color: #fecaca; line-height: 1.8; font-size: 14px;">
                                <li>Transaction ID or reference number</li>
                                <li>Amount paid</li>
                                <li>Date of transaction</li>
                                <li>Recipient details</li>
                            </ul>
                        </div>
                        `}

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                                If you have any questions, please reply to this email or contact our support team.
                            </p>
                            <p style="color: #6b7280; font-size: 11px; margin: 10px 0;">
                                © 2026 GENESIS. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        console.log(`\n📧 === SENDING PAYMENT VERIFICATION EMAIL ===`);
        console.log(`To: ${leadEmail}`);
        console.log(`Team: ${teamName} (${teamId})`);
        console.log(`Status: ${paymentStatus}`);

        const result = await transporter.sendMail(mailOptions);
        console.log(`✓ SUCCESSFULLY sent to ${leadEmail}`);
        console.log(`Response ID: ${result.response}`);
        console.log(`Message ID: ${result.messageId}`);
        return true;
    } catch (error) {
        console.error(`\n🔥 === FAILED TO SEND EMAIL ===`);
        console.error(`To: ${leadEmail}`);
        console.error(`Team: ${teamName} (${teamId})`);
        console.error(`Error Name: ${error.name}`);
        console.error(`Error Message: ${error.message}`);
        console.error(`Error Code: ${error.code}`);
        if (error.response) {
            console.error(`SMTP Response: ${error.response}`);
        }
        if (error.stack) {
            console.error(`Stack Trace:\n${error.stack}`);
        }
        return false;
    }
};

module.exports = {
    sendRegistrationEmail,
    sendPaymentVerificationEmail
};
