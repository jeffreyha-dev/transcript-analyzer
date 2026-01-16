import crypto from 'crypto';
import { runQuery } from '../database.js';

/**
 * Generate OAuth 1.0 signature for LivePerson API
 */
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
    // Sort parameters
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    // Create signature base string
    const signatureBaseString = [
        method.toUpperCase(),
        encodeURIComponent(url),
        encodeURIComponent(sortedParams)
    ].join('&');

    // Create signing key
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

    // Generate signature
    const signature = crypto
        .createHmac('sha1', signingKey)
        .update(signatureBaseString)
        .digest('base64');

    return signature;
}

/**
 * Generate OAuth 1.0 authorization header
 */
function generateOAuthHeader(account, method, url, additionalParams = {}) {
    // Handle both full account object or just credentials object
    const consumer_key = account.consumer_key || account.consumerKey;
    const token = account.token;
    const consumer_secret = account.consumer_secret || account.consumerSecret;
    const token_secret = account.token_secret || account.tokenSecret;

    const oauthParams = {
        oauth_consumer_key: consumer_key,
        oauth_token: token,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_version: '1.0'
    };

    // Extract query parameters from URL
    const [baseUrl, queryString] = url.split('?');
    const queryParams = {};

    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) {
                queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
            }
        });
    }

    // Combine OAuth params, query params, and additional params for signature
    const allParams = { ...oauthParams, ...queryParams, ...additionalParams };

    // Generate signature using the base URL (without query params)
    const signature = generateOAuthSignature(
        method,
        baseUrl,
        allParams,
        consumer_secret,
        token_secret
    );

    oauthParams.oauth_signature = signature;

    // Build authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
        .sort()
        .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
        .join(', ');

    return authHeader;
}

/**
 * Get LivePerson domain for a service
 */
async function getLivePersonDomain(accountId, serviceName) {
    try {
        const response = await fetch(
            `https://api.liveperson.net/api/account/${accountId}/service/${serviceName}/baseURI.json?version=1.0`
        );

        if (!response.ok) {
            throw new Error(`Failed to get domain: ${response.statusText}`);
        }

        const data = await response.json();
        return data.baseURI;
    } catch (error) {
        console.error('Error getting LP domain:', error);
        throw error;
    }
}

/**
 * Test LivePerson connection
 */
export async function testLivePersonConnection(account) {
    try {
        // Get the messaging history domain
        const domain = await getLivePersonDomain(account.account_id, account.service_name || 'msgHist');

        // Build test URL (simple account info request)
        const url = `https://${domain}/messaging_history/api/account/${account.account_id}/conversations/search`;

        // Generate OAuth header
        const authHeader = generateOAuthHeader(account, 'POST', url);

        // Make test request with minimal payload
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start: {
                    from: Date.now() - 86400000, // Last 24 hours
                    to: Date.now()
                },
                limit: 1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Connection test failed: ${response.status} - ${errorText}`);
        }

        return {
            success: true,
            message: 'Connection successful',
            domain
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Fetch available skills for an account
 */
export async function fetchSkills(account) {
    try {
        const accountId = account.account_id || account.accountId;

        // Discover accountConfigReadWrite domain
        const domain = await getLivePersonDomain(accountId, 'accountConfigReadWrite');

        // Construct skills API URL
        const url = `https://${domain}/api/account/${accountId}/configuration/le-users/skills`;

        const authHeader = generateOAuthHeader(account, 'GET', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Skills API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Transform to consistent format with id and name
        if (Array.isArray(data)) {
            return data.map(skill => ({
                id: skill.id,
                name: skill.name || `Skill ${skill.id}`,
            }));
        }

        return [];
    } catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
}

/**
 * Fetch conversations from LivePerson
 */
export async function fetchLivePersonConversations(account, options = {}) {
    try {
        const { startDate, endDate, limit = 100, offset = 0, status, skills, onProgress } = options;

        console.log('Fetching LP conversations with options:', options);

        // Get the messaging history domain
        const domain = await getLivePersonDomain(account.account_id, account.service_name || 'msgHist');
        console.log('LP Domain:', domain);

        // Build API URL with query params for offset and limit
        const limitParam = Math.min(limit, 100);
        const url = `https://${domain}${account.api_endpoint_path.replace('{accountId}', account.account_id)}?offset=${offset || 0}&limit=${limitParam}`;

        // Build request payload
        const payload = {
            start: {
                from: startDate ? new Date(startDate).getTime() : Date.now() - 7 * 86400000,
                to: endDate ? new Date(endDate).getTime() : Date.now()
            }
        };

        // Add status filter if specified
        if (status) {
            payload.status = Array.isArray(status) ? status : [status];
        }

        // Add skills filter if specified
        if (skills && skills.length > 0) {
            payload.skill = Array.isArray(skills) ? skills : [skills];
        }

        const authHeader = generateOAuthHeader(account, 'POST', url);

        // Fetch conversations
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LP API Error:', response.status, errorText);
            throw new Error(`Failed to fetch conversations: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const totalRecords = data._metadata?.count || 0;

        // Process and store conversations
        const imported = await processAndStoreConversations(data, account, limit);

        // Report progress
        if (onProgress) {
            onProgress(imported, totalRecords);
        }

        return {
            success: true,
            totalFetched: totalRecords,
            imported,
            apiReturned: data.conversationHistoryRecords?.length || 0,
            message: `Successfully fetched ${imported} conversations`
        };
    } catch (error) {
        console.error('Error fetching LP conversations:', error);
        throw error;
    }
}

/**
 * Process and store LivePerson conversations in database
 */
async function processAndStoreConversations(data, account, limit = 100) {
    let imported = 0;

    if (!data.conversationHistoryRecords || !Array.isArray(data.conversationHistoryRecords)) {
        return imported;
    }

    // Limit the number of conversations to process
    const conversationsToProcess = data.conversationHistoryRecords.slice(0, limit);

    for (const record of conversationsToProcess) {
        try {
            const conversationId = `lp_${account.account_id}_${record.info.conversationId}`;

            // Build transcript from messages
            const transcript = record.messageRecords
                ?.map((msg) => {
                    let sender = 'Consumer';
                    if (msg.sentBy === 'Agent') sender = 'Agent';
                    else if (msg.sentBy === 'Consumer') sender = 'Consumer';
                    else return null;

                    let text = msg.messageData?.msg?.text || '';
                    if (!text || String(text).trim() === '') return null;
                    text = String(text).replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim();

                    return `${sender}: ${text}`;
                })
                .filter(Boolean)
                .join('\n') || '';

            // Calculate conversation date and duration
            const startTime = record.info.startTime;
            const endTime = record.info.endTime || Date.now();
            const durationMinutes = (endTime - startTime) / 60000;

            // Insert conversation
            await runQuery(`
                INSERT OR REPLACE INTO conversations 
                (conversation_id, transcript_details, conversation_date, message_count, duration_minutes, source, external_id, fetched_at, lp_account_id, raw_lp_response)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                conversationId,
                transcript,
                new Date(startTime).toISOString(),
                record.messageRecords?.length || 0,
                durationMinutes,
                'liveperson',
                record.info.conversationId,
                new Date().toISOString(),
                account.id,
                JSON.stringify(record)
            ]);

            imported++;
        } catch (error) {
            console.error('Error storing conversation:', error);
        }
    }

    return imported;
}
