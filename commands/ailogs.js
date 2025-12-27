const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'ailogs',
    description: 'Show recent AI moderation logs',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('You do not have permission.');
        
        const target = message.mentions.users.first();
        let logs;
        
        if (target) {
            logs = db.prepare('SELECT * FROM ai_logs WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 5').all(message.guild.id, target.id);
        } else {
            logs = db.prepare('SELECT * FROM ai_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT 5').all(message.guild.id);
        }

        if (logs.length === 0) return message.reply('No AI logs found.');

        const embed = new EmbedBuilder()
            .setTitle(target ? `AI Logs for ${target.tag}` : 'Recent Server AI Logs')
            .setColor('#00FF00')
            .setTimestamp();

        logs.forEach((log, index) => {
            embed.addFields({
                name: `Log #${log.id} - ${log.created_at}`,
                value: `**User:** <@${log.user_id}>\n**Action:** ${log.action}\n**Content:** ${log.content.substring(0, 100)}...`
            });
        });

        message.reply({ embeds: [embed] });
    }
};