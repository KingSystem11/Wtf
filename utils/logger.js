const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    async logEvent(guild, embed, type = 'normal') {
        const config = db.prepare('SELECT log_channel, log_level FROM guild_config WHERE guild_id = ?').get(guild.id);
        if (!config || !config.log_channel) return;

        const guildLogLevel = config.log_level || 'normal';
        
        // Log Level Logic:
        // low: only 'critical'
        // normal: 'critical' and 'normal'
        // high: everything ('critical', 'normal', 'minor')
        
        let shouldLog = false;
        if (guildLogLevel === 'high') {
            shouldLog = true;
        } else if (guildLogLevel === 'normal') {
            if (type === 'critical' || type === 'normal') shouldLog = true;
        } else if (guildLogLevel === 'low') {
            if (type === 'critical') shouldLog = true;
        }

        if (shouldLog) {
            const channel = guild.channels.cache.get(config.log_channel);
            if (channel) {
                try {
                    await channel.send({ embeds: [embed] });
                } catch (e) {
                    console.error('Logging failed:', e);
                }
            }
        }
    }
};