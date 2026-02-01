const fs = require('fs');
const path = require('path');

// Helper to wait
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log('Starting Concurrency Test...');
    const API_URL = 'http://localhost:5000/api/teams/register';
    const CONCURRENCY = 5; // Number of simultaneous requests

    try {
        const filePath = path.join(__dirname, '../client/public/logo.png');
        if (!fs.existsSync(filePath)) {
            // Create a dummy file if not exists
            fs.writeFileSync('dummy_logo.png', 'fake image data');
        }

        const fileBuffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : fs.readFileSync('dummy_logo.png');
        const fileBlob = new Blob([fileBuffer], { type: 'image/png' });

        const requests = [];

        for (let i = 0; i < CONCURRENCY; i++) {
            const formData = new FormData();
            const timestamp = Date.now() + i;
            formData.append('teamName', `Concurrent Team ${timestamp}`);
            formData.append('utr', `UTR_${timestamp}`);

            const leader = {
                name: `Leader ${i}`,
                email: `leader${i}@test.com`,
                mobileNumber: '1234567890',
                registerNumber: `REG${timestamp}`,
                isHosteler: false,
                gender: 'Male',
                department: 'CSE',
                yearOfStudy: 'IV'
            };
            formData.append('leader', JSON.stringify(leader));

            const members = [
                { name: 'M1', registerNumber: `M1_${timestamp}`, mobileNumber: '000', isHosteler: false, gender: 'Male', department: 'CSE', yearOfStudy: 'IV' },
                { name: 'M2', registerNumber: `M2_${timestamp}`, mobileNumber: '000', isHosteler: false, gender: 'Male', department: 'CSE', yearOfStudy: 'IV' },
                { name: 'M3', registerNumber: `M3_${timestamp}`, mobileNumber: '000', isHosteler: false, gender: 'Male', department: 'CSE', yearOfStudy: 'IV' },
                { name: 'M4', registerNumber: `M4_${timestamp}`, mobileNumber: '000', isHosteler: false, gender: 'Male', department: 'CSE', yearOfStudy: 'IV' }
            ];
            formData.append('members', JSON.stringify(members));
            formData.append('screenshot', fileBlob, 'logo.png');

            requests.push(
                fetch(API_URL, {
                    method: 'POST',
                    body: formData
                }).then(async res => {
                    const text = await res.text();
                    return { status: res.status, body: text, idx: i };
                }).catch(err => ({ status: 'ERR', body: err.message, idx: i }))
            );
        }

        console.log(`Sending ${CONCURRENCY} requests simultaneously...`);
        const results = await Promise.all(requests);

        let successCount = 0;
        let failCount = 0;
        results.forEach(r => {
            console.log(`Req ${r.idx}: ${r.status}`);
            if (r.status !== 201) {
                console.log('Error Body:', r.body);
            }
        });

        console.log(`\nTest Complete. Success: ${successCount}, Fail: ${failCount}`);

    } catch (err) {
        console.error('Test Setup Failed:', err);
    }
}

runTest();
