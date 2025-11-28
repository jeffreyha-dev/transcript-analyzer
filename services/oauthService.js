import crypto from 'crypto';

/**
 * OAuth 1.0a Service for LivePerson API Authentication
 * Implements HMAC-SHA256 signature generation
 */

/**
 * RFC 3986 URL encoding
 * Encodes special characters that encodeURIComponent doesn't handle
 */
function rfc3986Encode(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

/**
 * Generate OAuth 1.0a Authorization header
 * @param {string} url - Full URL including query parameters
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object} credentials - OAuth credentials
 * @param {string} credentials.consumer_key - App Key
 * @param {string} credentials.consumer_secret - App Secret
 * @param {string} credentials.token - Access Token
 * @param {string} credentials.token_secret - Access Token Secret
 * @returns {string} OAuth Authorization header value
 */
export function generateOAuthHeader(url, method, credentials) {
    const { consumer_key, consumer_secret, token, token_secret } = credentials;

    // Split URL into base and query string
    const [baseUrl, queryString = ''] = url.split('?');

    // Parse query parameters
    const queryParams = {};
    if (queryString) {
        queryString.split('&').forEach((pair) => {
            if (!pair) return;
            const [key, value = ''] = pair.split('=');
            const encodedKey = rfc3986Encode(decodeURIComponent(key));
            const encodedValue = rfc3986Encode(decodeURIComponent(value));
            queryParams[encodedKey] = encodedValue;
        });
    }

    // OAuth parameters
    const oauthParams = {
        oauth_consumer_key: rfc3986Encode(consumer_key),
        oauth_token: rfc3986Encode(token),
        oauth_nonce: rfc3986Encode(crypto.randomBytes(16).toString('hex')),
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_signature_method: 'HMAC-SHA256',
        oauth_version: '1.0',
    };

    // Combine all parameters
    const allParams = { ...queryParams, ...oauthParams };

    // Sort parameters alphabetically
    const sortedKeys = Object.keys(allParams).sort();

    // Create parameter string
    const paramString = sortedKeys
        .map((key) => `${key}=${allParams[key]}`)
        .join('&');

    // Create signature base string
    const signatureBaseString = [
        method.toUpperCase(),
        rfc3986Encode(baseUrl),
        rfc3986Encode(paramString),
    ].join('&');

    // Create signing key
    const signingKey = `${rfc3986Encode(consumer_secret)}&${rfc3986Encode(token_secret)}`;

    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', signingKey);
    hmac.update(signatureBaseString);
    const signature = hmac.digest('base64');

    // Add signature to OAuth parameters
    oauthParams.oauth_signature = rfc3986Encode(signature);

    // Build Authorization header
    const headerParts = Object.keys(oauthParams)
        .sort()
        .map((key) => `${key}="${oauthParams[key]}"`)
        .join(', ');

    return `OAuth ${headerParts}`;
}

/**
 * Test OAuth signature generation
 * Useful for debugging authentication issues
 */
export function testOAuthSignature(url, method, credentials) {
    try {
        const header = generateOAuthHeader(url, method, credentials);
        return {
            success: true,
            header,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        };
    }
}
