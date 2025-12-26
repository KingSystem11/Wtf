// Guild status summary for dashboard/inspection
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    getGuildStatus(guild) {
        try {
            const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guild.id);
            
            // Count cases
            const casesCount = db.prepare('SELECT COUNT(*) as count FROM cases WHERE guild_id = ?').get(guild.id).count;
            const aiLogsCount = db.prepare('SELECT COUNT(*) as count FROM ai_logs WHERE guild_id = ?').get(guild.id).count;
            const antinukeCount = db.prepare('SELECT COUNT(*) as count FROM antinuke_cases WHERE guild_id = ?').get(guild.id).count;
            const wordFiltersCount = db.prepare('SELECT COUNT(*) as count FROM word_filters WHERE guild_id = ?').get(guild.id).count;

            // Premium status
            const premium = db.prepare('SELECT expires_at FROM premium_guilds WHERE guild_id = ?').get(guild.id);
            const isPremium = premium && (new Date(premium.expires_at) > new Date());

            const status = {
                guildId: guild.id,
                guildName: guild.name,
                memberCount: guild.memberCount,
                owner: guild.ownerId,
                
                security: {
                    antispam: config?.antispam === 1,
                    antilink: config?.antilink === 1,
                    antiraid: config?.antiraid === 1,
                    antinuke: config?.antinuke === 1,
                    aifilter: config?.aifilter === 1,
                    aiMode: config?.ai_mode || 'normal',
                    globalbanEnabled: config?.globalban_enabled === 1,
                    extraOwners: db.prepare('SELECT COUNT(*) as count FROM extra_owners WHERE guild_id = ?').get(guild.id)?.count || 0,
                    whitelistEntries: db.prepare('SELECT COUNT(*) as count FROM whitelist WHERE guild_id = ?').get(guild.id)?.count || 0,
                },
                
                counts: {
                    moderationCases: casesCount,
                    aiLogs: aiLogsCount,
                    antinukeEvents: antinukeCount,
                    wordFilters: wordFiltersCount,
                },
                
                premium: {
                    active: isPremium,
                    expiresAt: premium?.expires_at || null,
                },
            };

            return status;
        } catch (err) {
            console.error('Status fetch error:', err);
            return null;
        }
    },
};
