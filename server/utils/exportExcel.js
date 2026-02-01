const { Parser } = require('json2csv');

/**
 * Export all team details to CSV
 * Includes: Team Code, Team Name, All member information
 */
const exportAllDetails = async (teams) => {
    try {
        const rows = [];

        teams.forEach(team => {
            // Leader row
            rows.push({
                'Team Code': team.teamId,
                'Team Name': team.teamName,
                'Role': 'Team Lead',
                'Name': team.leader.name,
                'Register Number': team.leader.registerNumber,
                'Mobile': team.leader.mobileNumber,
                'Email': team.leader.email || '-',
                'Year': team.leader.yearOfStudy || '-',
                'Department': team.leader.department || '-',
                'Accommodation': team.leader.isHosteler ? 'Hosteler' : 'Day Scholar',
                'Hostel Name': team.leader.hostelName || '-',
                'Room Number': team.leader.roomNumber || '-',
                'Registration Date': new Date(team.createdAt).toLocaleDateString(),
                'Payment Status': team.payment.status
            });

            // Members rows
            team.members.forEach((member, index) => {
                rows.push({
                    'Team Code': team.teamId,
                    'Team Name': team.teamName,
                    'Role': `Member ${index + 1}`,
                    'Name': member.name,
                    'Register Number': member.registerNumber,
                    'Mobile': member.mobileNumber,
                    'Email': member.email || '-',
                    'Year': member.yearOfStudy || '-',
                    'Department': member.department || '-',
                    'Accommodation': member.isHosteler ? 'Hosteler' : 'Day Scholar',
                    'Hostel Name': member.hostelName || '-',
                    'Room Number': member.roomNumber || '-',
                    'Registration Date': new Date(team.createdAt).toLocaleDateString(),
                    'Payment Status': team.payment.status
                });
            });
        });

        const fields = [
            'Team Code', 'Team Name', 'Role', 'Name', 'Register Number',
            'Mobile', 'Email', 'Year', 'Department', 'Accommodation',
            'Hostel Name', 'Room Number', 'Registration Date', 'Payment Status'
        ];

        const json2csvParser = new Parser({ fields });
        return json2csvParser.parse(rows);
    } catch (err) {
        console.error('Error exporting all details:', err);
        throw err;
    }
};

/**
 * Export screenshot details to CSV
 * Includes: Team Code, Team Name, Screenshot Link only
 */
const exportScreenshotDetails = async (teams) => {
    try {
        const rows = [];

        teams.forEach(team => {
            rows.push({
                'Team ID': team.teamId,
                'Team Name': team.teamName,
                'Team QR': team.payment.screenshotUrl || 'Not Uploaded'
            });
        });

        const fields = ['Team ID', 'Team Name', 'Team QR'];

        const json2csvParser = new Parser({ fields });
        return json2csvParser.parse(rows);
    } catch (err) {
        console.error('Error exporting screenshot details:', err);
        throw err;
    }
};

module.exports = {
    exportAllDetails,
    exportScreenshotDetails
};
