const fs = require('fs');
const path = require('path');

async function testRegister() {
    try {
        const filePath = path.join(__dirname, '../client/public/logo.png');
        if (!fs.existsSync(filePath)) {
            console.error('Test image not found at', filePath);
            return;
        }

        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        console.log(`Test image size: ${fileSizeInBytes} bytes`);

        const { fetch, FormData, Blob } = global; // Ensure using Node built-ins

        const formData = new FormData();
        formData.append('teamName', `Test Team ${Date.now()}`);
        formData.append('utr', `UTR${Date.now()}`);

        const leader = {
            name: 'Test Leader',
            email: 'test@example.com',
            mobileNumber: '1234567890',
            registerNumber: 'RA2011003010001',
            isHosteler: false,
            gender: 'Male',
            department: 'CSE',
            yearOfStudy: 'IV'
        };
        formData.append('leader', JSON.stringify(leader));

        const members = [
            { name: 'Member 1', registerNumber: 'RA2011003010002', mobileNumber: '1234567890', isHosteler: false, gender: 'Male', department: 'CSE', yearOfStudy: 'IV' },
            { name: 'Member 2', registerNumber: 'RA2011003010003', mobileNumber: '1234567890', isHosteler: false, gender: 'Male', department: 'CSE', yearOfStudy: 'IV' },
            { name: 'Member 3', registerNumber: 'RA2011003010004', mobileNumber: '1234567890', isHosteler: false, gender: 'Male', department: 'CSE', yearOfStudy: 'IV' },
            { name: 'Member 4', registerNumber: 'RA2011003010005', mobileNumber: '1234567890', isHosteler: false, gender: 'Male', department: 'CSE', yearOfStudy: 'IV' }
        ];
        formData.append('members', JSON.stringify(members));

        // Create a blob from the file buffer
        const buffer = fs.readFileSync(filePath);
        const fileBlob = new Blob([buffer], { type: 'image/png' });

        formData.append('screenshot', fileBlob, 'logo.png');

        console.log('Sending POST request to http://localhost:5000/api/teams/register');

        const response = await fetch('http://localhost:5000/api/teams/register', {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

    } catch (err) {
        console.error('Test Script Error:', err);
    }
}

testRegister();
