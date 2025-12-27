const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    category: "Moderation",
    category: "Security",
    name: 'case',
    description: 'Fetch security case details',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('You do not have permission.');
        
        const caseId = parseInt(args[0]);
        const type = args[1]?.toLowerCase(); // 'ai' or 'antinuke'

        if (isNaN(caseId) || !['ai', 'antinuke'].includes(type)) {
            return message.reply('Usage: `s!case <id> <ai/antinuke>`');
        }

        let caseData;
        if (type === 'ai') {
            caseData = db.prepare('SELECT * FROM ai_logs WHERE id = ? AND guild_id = ?').get(caseId, message.guild.id);
        } else {
            caseData = db.prepare('SELECT * FROM antinuke_cases WHERE id = ? AND guild_id = ?').get(caseId, message.guild.id);
        }

        if (!caseData) return message.reply('Case not found.');

        const embed = new EmbedBuilder()
            .setTitle(`${getEmoji('CASE')} Case Details: ${type.toUpperCase()} #${caseId}`)
            .setColor('#00FF00')
            .setTimestamp(new Date(caseData.created_at || caseData.date));

        if (type === 'ai') {
            embed.addFields(
                { name: 'User', value: `<@${caseData.user_id}>`, inline: true },
                { name: 'Risk Score', value: caseData.risk_score, inline: true },
                { name: 'Action', value: caseData.action, inline: true },
                { name: 'Content', value: caseData.content.substring(0, 1024) }
            );
        } else {
            embed.addFields(
                { name: 'Executor', value: `<@${caseData.executor_id}>`, inline: true },
                { name: 'Type', value: caseData.type, inline: true },
                { name: 'Count', value: caseData.count.toString(), inline: true }
            );
        }

        message.reply({ embeds: [embed] });
    }
};