import fetch from 'node-fetch';
import { generateOAuthHeader } from './oauthService.js';

/**
 * LivePerson Messaging History API Service
 * Handles conversation fetching, domain discovery, and transcript building
 */

/**
 * Discover the service domain for a LivePerson service
 * @param {string} accountId - LivePerson account ID
 * @param {string} serviceName - Service name (e.g., 'msgHist')
 * @param {object} credentials - OAuth credentials
 * @returns {Promise<string>} Service domain
 */
export async function discoverServiceDomain(accountId, serviceName, credentials) {
    const url = `https://api.liveperson.net/api/account/${accountId}/service/${serviceName}/baseURI.json?version=1.0`;

    const authHeader = generateOAuthHeader(url, 'GET', credentials);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Domain discovery failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.baseURI) {
        throw new Error('Domain API did not return baseURI');
    }

    return data.baseURI;
}

/**
 * Build transcript from LivePerson message records
 * @param {Array} messageRecords - Array of message objects
 * @returns {string} Formatted transcript
 */
export function buildTranscript(messageRecords) {
    if (!Array.isArray(messageRecords)) {
        return '';
    }

    const lines = [];

    for (const message of messageRecords) {
        const role = message?.sentBy === 'Consumer' ? 'Consumer'
            : message?.sentBy === 'Agent' ? 'Agent'
                : null;

        if (!role) continue;

        let text = message?.messageData?.msg?.text ?? '';
        if (!text || String(text).trim() === '') continue;

        // Normalize whitespace to keep one line per message
        text = String(text)
            .replace(/\r\n|\r|\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        lines.push(`${role}: ${text}`);
    }

    return lines.join('\n');
}

/**
 * Fetch conversations from LivePerson
 * @param {object} params - Fetch parameters
 * @param {object} params.credentials - OAuth credentials
 * @param {object} params.dateRange - { from: timestamp, to: timestamp }
 * @param {Array<string>} params.status - Conversation statuses (e.g., ['CLOSE'])
 * @param {Array<number>} params.skillIds - Optional skill IDs filter
 * @param {number} params.batchSize - Number of conversations per page (default: 20)
 * @param {function} params.onProgress - Progress callback (current, total)
 * @returns {Promise<Array>} Array of conversation objects
 */
export async function fetchConversations(params) {
    const {
        credentials,
        dateRange,
        status = ['CLOSE'],
        skillIds = [],
        batchSize = 20,
        onProgress = null,
    } = params;

    const { accountId } = credentials;

    // Discover msgHist domain
    const domain = await discoverServiceDomain(accountId, 'msgHist', credentials);
    const baseUrl = `https://${domain}/messaging_history/api/account/${accountId}/conversations/search`;

    const conversations = [];
    let offset = 0;
    let hasMore = true;
    let totalExpected = null;

    while (hasMore) {
        const url = `${baseUrl}?offset=${offset}&limit=${batchSize}`;

        const requestBody = {
            start: {
                from: dateRange.from,
                to: dateRange.to,
            },
            status,
        };

        // Add skill filter if provided
        if (skillIds.length > 0) {
            requestBody.latestSkillIds = skillIds;
        }

        const authHeader = generateOAuthHeader(url, 'POST', credentials);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LivePerson API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const convList = data.conversationHistoryRecords || [];

        // Try to detect total count
        if (totalExpected === null) {
            totalExpected = data.totalHits || data.total || data?._metadata?.count || null;
        }

        // Process conversations
        for (const conv of convList) {
            const convId = conv.info?.conversationId || '';
            const startTsRaw = conv.info?.startTs ?? conv.info?.start?.time ?? conv.info?.startTime;

            // Safely convert timestamp to ISO string
            let startTs = null;
            if (startTsRaw) {
                try {
                    const timestamp = Number(startTsRaw);
                    if (!isNaN(timestamp) && timestamp > 0) {
                        const date = new Date(timestamp);
                        if (!isNaN(date.getTime())) {
                            startTs = date.toISOString();
                        }
                    }
                } catch (error) {
                    console.warn(`Invalid timestamp for conversation ${convId}:`, startTsRaw);
                }
            }

            const transcript = buildTranscript(conv.messageRecords || []);

            conversations.push({
                external_id: convId,
                conversation_date: startTs,
                transcript_details: transcript,
                raw_response: JSON.stringify(conv),
                message_count: (conv.messageRecords || []).length,
            });
        }

        offset += batchSize;
        hasMore = convList.length === batchSize;

        // Call progress callback
        if (onProgress) {
            onProgress(conversations.length, totalExpected);
        }

        // Rate limiting delay
        if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    return conversations;
}

/**
 * Test LivePerson account credentials
 * @param {object} credentials - OAuth credentials
 * @returns {Promise<object>} Test result
 */
export async function testConnection(credentials) {
    try {
        const { accountId } = credentials;

        // Try to discover msgHist domain as a connection test
        const domain = await discoverServiceDomain(accountId, 'msgHist', credentials);

        return {
            success: true,
            message: 'Connection successful',
            domain,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
        };
    }
}
