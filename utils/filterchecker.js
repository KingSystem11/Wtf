// Word and Regex Filter Checker
const db = require('./db');

module.exports = {
    async checkFilters(message) {
        if (!message.guild) return null;

        try {
            const filters = db.all('SELECT id, pattern, type, action FROM word_filters WHERE guild_id = ?', [message.guild.id]);
            
            for (const filter of filters) {
                let matched = false;
                
                if (filter.type === 'word') {
                    // Exact word match (case-insensitive)
                    const words = message.content.toLowerCase().split(/\s+/);
                    matched = words.includes(filter.pattern.toLowerCase());
                } else if (filter.type === 'regex') {
                    // Regex match
                    try {
                        const regex = new RegExp(filter.pattern, 'i');
                        matched = regex.test(message.content);
                    } catch (e) {
                        console.error(`Invalid regex pattern: ${filter.pattern}`, e);
                        continue;
                    }
                }
                
                if (matched) {
                    return {
                        filterId: filter.id,
                        pattern: filter.pattern,
                        type: filter.type,
                        action: filter.action,
                    };
                }
            }
            
            return null;
        } catch (err) {
            console.error('Filter check error:', err);
            return null;
        }
    },

    async logFilterAction(guild, message, filter, actionTaken) {
        try {
            const config = db.query('SELECT log_channel FROM guild_config WHERE guild_id = ?', [guild.id]);
            if (!config?.log_channel) return;

            const { logEvent } = require('./logger');
            const { getLocalizedString } = require('./localization');
            
            const typeLabel = filter.type === 'regex' ? '(Regex)' : '(Word)';
            const title = getLocalizedString(guild.id, 'wordfilter_log_title');
            
            const embed = {
                title: `🚫 ${title}`,
                color: 0xFF6B6B,
                fields: [
                    { name: 'User', value: `**${message.author.tag}**`, inline: true },
                    { name: 'Pattern', value: `\`${filter.pattern}\` ${typeLabel}`, inline: true },
                    { name: 'Action Taken', value: actionTaken, inline: true },
                ],
                timestamp: new Date(),
            };

            await logEvent(guild, embed, 'normal');
        } catch (err) {
            console.error('Failed to log filter action:', err);
        }
    },
};
