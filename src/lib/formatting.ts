/**
 * Formats a date consistently for both server and client rendering
 * to prevent hydration mismatches
 */
export function formatDate(dateString: string): string {
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
export function formatDateTime(dateString: string): string {
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

/**
 * Formats currency consistently
 */
export function formatCurrency(amountInPence: number): string {
    return `£${(amountInPence / 100).toFixed(2)}`;
}
