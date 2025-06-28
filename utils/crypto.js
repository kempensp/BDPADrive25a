const crypto = require('crypto');

/**
 * Generate a random salt
 * @returns {string} A 32-character hexadecimal salt string
 */
function generateSalt() {
    return crypto.randomBytes(16).toString('hex'); // 16 bytes = 32 hex characters
}

/**
 * Generate a key from password and salt using PBKDF2
 * @param {string} password - The user's password
 * @param {string} salt - The salt to use
 * @returns {string} A hexadecimal key string
 */
function generateKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

/**
 * Generate both salt and key for a new user registration
 * @param {string} password - The user's password
 * @returns {object} Object containing salt and key
 */
function generateSaltAndKey(password) {
    const salt = generateSalt();
    const key = generateKey(password, salt);
    return { salt, key };
}

module.exports = {
    generateSalt,
    generateKey,
    generateSaltAndKey
};
