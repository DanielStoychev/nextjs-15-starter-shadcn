// Test the formatting utility

/**
 * Formats a date consistently for both server and client rendering
 * to prevent hydration mismatches
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);

        // Ensure consistent formatting by manually constructing the string
        // This prevents locale-based differences between server and client
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Date formatting error:', error);

        return 'Invalid Date';
    }
}

/**
 * Formats a date with time consistently
 */
function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);

        // Manually construct the string for consistency
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error('DateTime formatting error:', error);

        return 'Invalid Date';
    }
}

console.log('Testing date formatting...');

const testDate = '2025-06-20T10:30:00.000Z';
console.log('Input:', testDate);
console.log('formatDate output:', formatDate(testDate));
console.log('formatDateTime output:', formatDateTime(testDate));

// Test with current date
const now = new Date().toISOString();
console.log('\nTesting with current date...');
console.log('Input:', now);
console.log('formatDate output:', formatDate(now));
console.log('formatDateTime output:', formatDateTime(now));
