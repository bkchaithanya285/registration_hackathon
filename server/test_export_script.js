const { Parser } = require('json2csv');

try {
    console.log('Testing json2csv...');
    const fields = ['field1', 'field2'];
    const data = [{ field1: 'value1', field2: 'value2' }];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    console.log('CSV Output:', csv);
    console.log('json2csv works correctly!');
} catch (err) {
    console.error('Error testing json2csv:', err);
}
