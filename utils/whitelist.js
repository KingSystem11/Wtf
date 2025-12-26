const db = require('./db');

module.exports = {
    isWhitelisted(member, scope) {
        if (!member || !member.guild) return false;
        
        // Beast Mode logic: Whitelist doesn't bypass Beast Mode
        if (scope === 'beast') return false;

        // Always whitelist guild owner
        if (member.id === member.guild.ownerId) return true;

        const entries = db.all('SELECT target_id, type, scopes FROM whitelist WHERE guild_id = ?', [member.guild.id]);
        
        for (const entry of entries) {
            const scopes = entry.scopes.split(',').map(s => s.trim().toLowerCase());
            if (!scopes.includes(scope.toLowerCase())) continue;

            if (entry.type === 'user' && member.id === entry.target_id) return true;
            if (entry.type === 'role' && member.roles.cache.has(entry.target_id)) return true;
        }

        return false;
    },

    async logWhitelistSkip(guild, user, scope) {
        try {
            const config = db.query('SELECT log_channel FROM guild_config WHERE guild_id = ?', [guild.id]);
            if (!config?.log_channel) return;

            const { logEvent } = require('./logger');
            const { getEmoji } = require('./emojis');
            
            const embed = {
                title: `${getEmoji('VERIFY')} Whitelist Bypass`,
                color: 0x5865F2,
                description: `**${user.tag}** was whitelisted for **${scope}**, action skipped.`,
                timestamp: new Date(),
            };

            await logEvent(guild, embed, 'normal');
        } catch (err) {
            console.error('Failed to log whitelist skip:', err);
        }
    }
};
