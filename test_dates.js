// Test script to verify date handling
const startDate = '2025-11-21';
const endDate = '2025-11-28';

const payload = {
    start: {
        from: new Date(startDate).getTime(),
        to: new Date(endDate).getTime()
    },
    limit: 100
};

console.log('Date conversion test:');
console.log('Input dates:', { startDate, endDate });
console.log('Timestamps:', payload.start);
console.log('Converted back:', {
    from: new Date(payload.start.from).toISOString(),
    to: new Date(payload.start.to).toISOString()
});
console.log('\nPayload:', JSON.stringify(payload, null, 2));
