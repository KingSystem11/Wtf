// Global banlist across guilds
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    // Add user to global ban list
    addGlobalBan(userId, reason, guildId) {
        try {
            db.prepare(`
                INSERT OR IGNORE INTO global_bans (user_id, reason, added_by_guild_id, created_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `).run(userId, reason, guildId);
            return true;
        } catch (err) {
            console.error('Global ban add error:', err);
            return false;
        }
    },

    // Remove user from global ban list
    removeGlobalBan(userId) {
        try {
            db.prepare('DELETE FROM global_bans WHERE user_id = ?').run(userId);
            return true;
        } catch (err) {
            console.error('Global ban remove error:', err);
            return false;
        }
    },

    // Get global ban info for a user
    getGlobalBan(userId) {
        try {
            return db.prepare('SELECT * FROM global_bans WHERE user_id = ?').get(userId) || null;
        } catch (err) {
            console.error('Global ban lookup error:', err);
            return null;
        }
    },

    // Check if user is globally banned
    isGloballyBanned(userId) {
        const ban = this.getGlobalBan(userId);
        return ban !== null;
    },

    // Log global ban action
    async logGlobalBanAction(guild, userId, action, details) {
        try {
            const config = db.prepare('SELECT log_channel FROM guild_config WHERE guild_id = ?').get(guild.id);
            if (!config?.log_channel) return;

            const { logEvent } = require('./logger');
            const { getLocalizedString } = require('./localization');
            
            const title = getLocalizedString(guild.id, 'globalban_log_title');
            const embed = {
                title: `🌍 ${title}`,
                color: action === 'auto_ban' ? 0xFF0000 : (action === 'alert' ? 0xFFAA00 : 0x00FF00),
                fields: [
                    { name: 'User ID', value: userId, inline: true },
                    { name: 'Action', value: action.toUpperCase(), inline: true },
                ],
                timestamp: new Date(),
            };

            if (details) {
                embed.fields.push({ name: 'Details', value: details, inline: false });
            }

            await logEvent(guild, embed, 'critical');
        } catch (err) {
            console.error('Global ban log error:', err);
        }
    },
};
