const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    category: "Security",
    name: 'securityaudit',
    description: 'Review extra owners and whitelist security events (Guild Owner/Extra Owner Only)',
    highRisk: true,
    async execute(message, args) {
        const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        
        // Fetch Extra Owners
        const extraOwners = db.all('SELECT user_id FROM extra_owners WHERE guild_id = ?', [message.guild.id]);
        
        // Fetch Whitelist Entries
        const whitelistEntries = db.all('SELECT user_id, role_id, scope FROM whitelist WHERE guild_id = ?', [message.guild.id]);

        // Fetch Last 5 Whitelist Skip Logs (from cases)
        const skipLogs = db.all(`
            SELECT action, target_id, reason, created_at 
            FROM cases 
            WHERE guild_id = ? AND reason LIKE '%[Whitelist Bypass]%'
            ORDER BY created_at DESC 
            LIMIT 5
        `, [message.guild.id]);

        // Fetch Last 5 High-Risk Command usages (from cases if logged or general mod actions)
        const highRiskLogs = db.all(`
            SELECT action, target_id, reason, created_at 
            FROM cases 
            WHERE guild_id = ? AND (action LIKE '%Panic%' OR action LIKE '%Anti-Nuke%' OR action LIKE '%Extra Owner%' OR action LIKE '%Whitelist%')
            ORDER BY created_at DESC 
            LIMIT 5
        `, [message.guild.id]);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Security Audit Report')
            .setColor(0x3498db) // Blue
            .setTimestamp()
            .setFooter({ text: '👻 Audit trails are essential for server safety.' });

        // Extra Owners Section
        const ownerList = extraOwners.map(o => `<@${o.user_id}>`).join(', ') || 'None';
        embed.addFields({ name: `👑 Extra Owners (${extraOwners.length})`, value: ownerList });

        // Whitelist Section
        embed.addFields({ name: `📜 Whitelist Entries (${whitelistEntries.length})`, value: `Total entries active across all scopes.` });

        // Recent Whitelist Bypasses
        const bypassText = skipLogs.map(l => {
            const time = new Date(l.created_at).toLocaleString();
            return `• <@${l.target_id}> (${l.action}) - ${time}`;
        }).join('\n') || 'No recent bypasses recorded.';
        embed.addFields({ name: '⚡ Recent Whitelist Bypasses', value: bypassText });

        // Recent High-Risk Actions
        const riskText = highRiskLogs.map(l => {
            const time = new Date(l.created_at).toLocaleString();
            return `• **${l.action}** by <@${l.target_id}> - ${time}`;
        }).join('\n') || 'No recent high-risk actions recorded.';
        embed.addFields({ name: '⚠️ Recent High-Risk Actions', value: riskText });

        return message.reply({ embeds: [embed] });
    }
};
