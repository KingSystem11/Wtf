// Channel-specific setting overrides
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    // Get effective setting for a channel (prefers override, falls back to guild config)
    getEffectiveSetting(guild, channel, setting) {
        try {
            // Check for channel override first
            const override = db.prepare(
                `SELECT ${setting} FROM channel_overrides WHERE guild_id = ? AND channel_id = ?`
            ).get(guild.id, channel.id);

            if (override && override[setting] !== null) {
                return override[setting] === 1;
            }

            // Fall back to guild-wide setting
            const guildConfig = db.prepare(
                `SELECT ${setting} FROM guild_config WHERE guild_id = ?`
            ).get(guild.id);

            return guildConfig && guildConfig[setting] === 1;
        } catch (err) {
            console.error('Channel override lookup error:', err);
            return false;
        }
    },

    // Get full config for a channel (combining overrides and guild defaults)
    getChannelConfig(guild, channel, fields = []) {
        try {
            const result = {};
            
            for (const field of fields) {
                result[field] = this.getEffectiveSetting(guild, channel, field);
            }

            return result;
        } catch (err) {
            console.error('Channel config lookup error:', err);
            return {};
        }
    },

    // Set or unset a channel override
    setChannelOverride(guildId, channelId, setting, value) {
        try {
            if (value === null) {
                // Delete override (reset to guild default)
                db.prepare(
                    `DELETE FROM channel_overrides WHERE guild_id = ? AND channel_id = ?`
                ).run(guildId, channelId);
            } else {
                // Upsert override
                db.prepare(
                    `INSERT INTO channel_overrides (guild_id, channel_id, ${setting}) 
                     VALUES (?, ?, ?)
                     ON CONFLICT(guild_id, channel_id) DO UPDATE SET ${setting} = EXCLUDED.${setting}`
                ).run(guildId, channelId, value ? 1 : 0);
            }
            return true;
        } catch (err) {
            console.error('Channel override set error:', err);
            return false;
        }
    },

    // Get current overrides for a channel
    getChannelOverrides(guildId, channelId) {
        try {
            return db.prepare(
                `SELECT antispam, antilink, aifilter FROM channel_overrides WHERE guild_id = ? AND channel_id = ?`
            ).get(guildId, channelId) || null;
        } catch (err) {
            console.error('Channel overrides fetch error:', err);
            return null;
        }
    },

    // Reset all overrides for a channel
    resetChannelOverrides(guildId, channelId) {
        try {
            db.prepare(
                `DELETE FROM channel_overrides WHERE guild_id = ? AND channel_id = ?`
            ).run(guildId, channelId);
            return true;
        } catch (err) {
            console.error('Channel override reset error:', err);
            return false;
        }
    },
};
