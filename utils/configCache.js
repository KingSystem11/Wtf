const db = require('./db');

const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

module.exports = {
    /**
     * Get guild config from cache or database
     * @param {string} guildId - Guild ID
     * @returns {object} Guild configuration
     */
    getGuildConfig(guildId) {
        const now = Date.now();
        const cached = configCache.get(guildId);

        // Return if cache exists and not expired
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            return cached.data;
        }

        // Fetch from DB and cache
        const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
        if (config) {
            configCache.set(guildId, {
                data: config,
                timestamp: now
            });
        }

        return config;
    },

    /**
     * Invalidate cache for a guild (call when config changes)
     * @param {string} guildId - Guild ID
     */
    invalidateGuildConfig(guildId) {
        configCache.delete(guildId);
    },

    /**
     * Clear all cache (for testing or on restart)
     */
    clearAllCache() {
        configCache.clear();
    },

    /**
     * Get cache stats (for monitoring)
     */
    getCacheStats() {
        return {
            cachedGuilds: configCache.size,
            items: Array.from(configCache.entries()).map(([guildId, entry]) => ({
                guildId,
                age: Date.now() - entry.timestamp
            }))
        };
    }
};
