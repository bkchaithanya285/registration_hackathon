try {
    const { Parser } = require('json2csv');
    console.log('Parser imported:', typeof Parser);
    console.log('Parser is constructor:', typeof Parser.prototype);

    const rows = [{ col1: 'val1', col2: 'val2' }];
    const parser = new Parser();
    const csv = parser.parse(rows);
    console.log('CSV generated:', csv);
} catch (err) {
    console.error('Error:', err);
}

try {
    const json2csv = require('json2csv');
    console.log('json2csv object keys:', Object.keys(json2csv));
} catch (err) {
    console.error('Error requiring json2csv:', err);
}
