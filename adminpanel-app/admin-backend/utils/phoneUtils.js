/**
 * Normalize phone number by removing spaces and trimming
 * This ensures consistency across all driver-related operations
 * 
 * @param {string|null|undefined} phone - Phone number to normalize
 * @returns {string} Normalized phone number (without spaces, trimmed)
 */
function normalizePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return null;
    }
    // Remove all whitespace and trim
    return phone.replace(/\s+/g, '').trim();
}

/**
 * Generate a fallback phone number for users without phone
 * Format: user_{last8chars}
 * 
 * @param {string} userId - User ID
 * @returns {string} Generated phone number
 */
function generateFallbackPhone(userId) {
    return `user_${userId.slice(-8)}`;
}

/**
 * Normalize phone or generate fallback if phone is not provided
 * 
 * @param {string|null|undefined} phone - Phone number to normalize
 * @param {string} userId - User ID for fallback generation
 * @returns {string} Normalized phone or generated fallback
 */
function normalizePhoneOrFallback(phone, userId) {
    const normalized = normalizePhone(phone);
    return normalized || generateFallbackPhone(userId);
}

module.exports = {
    normalizePhone,
    generateFallbackPhone,
    normalizePhoneOrFallback,
};

