const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const strings = require('./strings');

/**
 * Get a localized string for a guild based on its language setting
 * @param {string} guildId - Guild ID
 * @param {string} key - String key (e.g., 'antispam_action')
 * @param {object} replacements - Object with {key: value} for template replacement
 * @returns {string} Localized string or English fallback
 */
function getLocalizedString(guildId, key, replacements = {}) {
    try {
        // Get guild language setting
        const config = db.prepare('SELECT language FROM guild_config WHERE guild_id = ?').get(guildId);
        const lang = config?.language || 'en';
        
        // Get string from language pack, fallback to English
        let str = strings[lang]?.[key] || strings.en[key] || `[Missing: ${key}]`;
        
        // Replace placeholders: {user}, {count}, {type}, etc.
        for (const [placeholder, value] of Object.entries(replacements)) {
            str = str.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
        }
        
        return str;
    } catch (err) {
        console.error('Localization error:', err);
        return strings.en[key] || `[Missing: ${key}]`;
    }
}

/**
 * Get multiple strings at once
 * @param {string} guildId - Guild ID
 * @param {array} keys - Array of string keys
 * @returns {object} Object with keys mapped to localized strings
 */
function getLocalizedStrings(guildId, keys) {
    const result = {};
    keys.forEach(key => {
        result[key] = getLocalizedString(guildId, key);
    });
    return result;
}

module.exports = {
    getLocalizedString,
    getLocalizedStrings,
    strings // Export raw strings for reference
};
