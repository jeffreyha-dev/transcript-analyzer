/**
 * CSV Export Service
 * Handles exporting LivePerson conversations to CSV format
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of conversation objects
 * @param {Array} columns - Column definitions
 * @returns {string} CSV string
 */
export function convertToCSV(data, columns) {
    if (!data || data.length === 0) {
        return '';
    }

    // Create header row
    const headers = columns.map(col => escapeCSVField(col.label));
    const headerRow = headers.join(',');

    // Create data rows
    const dataRows = data.map(row => {
        const values = columns.map(col => {
            const value = col.accessor(row);
            return escapeCSVField(value);
        });
        return values.join(',');
    });

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV field value
 * @param {any} value - Field value
 * @returns {string} Escaped CSV field
 */
function escapeCSVField(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Format LivePerson conversations for CSV export
 * @param {Array} conversations - Array of conversation objects
 * @returns {string} CSV string
 */
export function exportLivePersonConversations(conversations) {
    const columns = [
        {
            label: 'Conversation ID',
            accessor: (row) => row.conversation_id,
        },
        {
            label: 'External ID',
            accessor: (row) => row.external_id || '',
        },
        {
            label: 'Source',
            accessor: (row) => row.source || 'upload',
        },
        {
            label: 'Date',
            accessor: (row) => row.conversation_date || '',
        },
        {
            label: 'Transcript',
            accessor: (row) => row.transcript_details || '',
        },
        {
            label: 'Fetched At',
            accessor: (row) => row.fetched_at || '',
        },
        {
            label: 'LP Account ID',
            accessor: (row) => row.lp_account_id || '',
        },
        {
            label: 'Message Count',
            accessor: (row) => row.message_count || 0,
        },
    ];

    return convertToCSV(conversations, columns);
}

/**
 * Trigger CSV download in browser
 * @param {string} csvContent - CSV string
 * @param {string} filename - Filename for download
 */
export function downloadCSV(csvContent, filename = 'export.csv') {
    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
