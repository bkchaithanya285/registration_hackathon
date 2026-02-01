const axios = require('axios');
require('dotenv').config({ path: '.env' });

// Use the admin secret from the environment or logic you know
// In previous steps, we saw 'admin' checks in authMiddleware.
// Let's assume we can login or use valid credentials if needed.
// However, the export routes are protected by `authMiddleware`.
// We need a valid token.
// For testing purposes, we can try to "login" first if possible, or bypass if we had a secret.
// Looking at authMiddleware (via file view could confirm), it likely uses JWT.
// Let's look at `index.js` or `admin` controllers to see how to get a token or if we can use a hardcoded one for localhost?
// Wait, `test_register_script.js` didn't need a token for public registration.
// Admin endpoints DO need a token.

// Let's try to login as admin first.
// If we don't know the admin credentials, we might be stuck verifying via script without manual interaction.
// But we saw `adminCreateTeam` calls `authMiddleware` which usually checks `Authorization: Bearer ...`.
// We also saw `seedData` which might create an admin.
// User didn't give credentials.
// BUT, I verified `admin` exists in `server/index.js` logs: "Admin thecreatorofcreatex already exists".
// I probably don't know the password.
// Wait, I can verify the *code* starts up.
// I can also check if the *endpoint* is reachable (even if 401 Unauthorized), which at least proves the route exists.
// A 404 would mean I messed up the routes. A 401 means the route is there but protected. This is good enough for automated verification of "no crash".

async function testExports() {
    try {
        console.log('Testing /teams/admin/export/all-details...');
        try {
            await axios.get('http://localhost:5000/teams/admin/export/all-details');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('✅ Endpoint exists (401 Unauthorized expected without token)');
            } else {
                console.error('❌ Unexpected error:', err.message);
                console.log(err.response ? err.response.data : 'No response data');
            }
        }

        console.log('Testing /teams/admin/export/screenshot-details...');
        try {
            await axios.get('http://localhost:5000/teams/admin/export/screenshot-details');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('✅ Endpoint exists (401 Unauthorized expected without token)');
            } else {
                console.error('❌ Unexpected error:', err.message);
            }
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testExports();
