const db = require('./db');
const { getEmoji } = require('./emojis');

const actionTracking = new Map();

module.exports = {
    async trackBeastAction(guild, executor, actionType) {
        if (!executor || executor.id === guild.ownerId) return;

        const config = db.query('SELECT beast_enabled, beast_limit_ban, beast_limit_kick, beast_limit_everyone FROM guild_config WHERE guild_id = ?', [guild.id]);
        if (!config || !config.beast_enabled) return;

        // Premium Check
        const premium = db.query('SELECT expires_at FROM premium_guilds WHERE guild_id = ?', [guild.id]);
        const isPremium = premium && (new Date(premium.expires_at) > new Date());
        if (!isPremium) return;

        const key = `${guild.id}-${executor.id}-${actionType}`;
        const now = Date.now();
        const windowMs = 10 * 60 * 1000; // 10 minutes

        let actions = actionTracking.get(key) || [];
        actions = actions.filter(t => now - t < windowMs);
        actions.push(now);
        actionTracking.set(key, actions);

        const limit = config[`beast_limit_${actionType}`] || 5;

        if (actions.length > limit) {
            try {
                const member = await guild.members.fetch(executor.id).catch(() => null);
                if (!member) return;

                // Betrayal detected
                const dangerousPerms = [
                    'Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'ManageWebhooks', 'BanMembers', 'KickMembers'
                ];
                
                const rolesWithPerms = member.roles.cache.filter(role => 
                    dangerousPerms.some(perm => role.permissions.has(perm))
                );

                if (rolesWithPerms.size > 0) {
                    await member.roles.remove(rolesWithPerms, 'Beast Mode: Betrayal detected');
                }

                const { logEvent } = require('./logger');
                const { getLocalizedString } = require('./localization');
                const title = getLocalizedString(guild.id, 'beast_log_title');
                const desc = getLocalizedString(guild.id, 'beast_log_desc', {
                    user: executor.tag,
                    type: actionType,
                    count: actions.length,
                    limit: limit
                });
                const permsText = getLocalizedString(guild.id, 'beast_perms_removed');
                const embed = {
                    title: `${getEmoji('BAN')} ${title}`,
                    color: 0xFF0000,
                    description: `${desc}\n\n${permsText}`,
                    timestamp: new Date()
                };
                await logEvent(guild, embed, 'critical');
                
                actionTracking.set(key, []);
            } catch (e) {
                console.error('Beast Mode action failed:', e);
            }
        }
    }
};
