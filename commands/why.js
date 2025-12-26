const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'why',
    description: 'Explains your recent punishments and actions taken by Spectre',
    async execute(message, args) {
        const userId = message.author.id;
        const guildId = message.guild.id;

        // Fetch last 3 cases from cases table
        const cases = db.prepare(`
            SELECT action, reason, timestamp 
            FROM cases 
            WHERE user_id = ? AND guild_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 3
        `).all(userId, guildId);

        // Fetch last 3 AI logs if relevant (moderation intent)
        const aiLogs = db.prepare(`
            SELECT content, reason, timestamp 
            FROM ai_logs 
            WHERE user_id = ? AND guild_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 3
        `).all(userId, guildId);

        if (cases.length === 0 && aiLogs.length === 0) {
            return message.reply('Spectre has no recent actions against you in this server.');
        }

        const embed = new EmbedBuilder()
            .setTitle('⚖️ Your Punishment History')
            .setColor('#00FF00')
            .setDescription('Here are the most recent actions Spectre has recorded for your account in this server.')
            .setTimestamp();

        if (cases.length > 0) {
            let caseText = '';
            cases.forEach(c => {
                const date = new Date(c.timestamp).toLocaleDateString();
                caseText += `**${c.action}** - ${c.reason} (${date})\n`;
            });
            embed.addFields({ name: 'Recent Cases', value: caseText });
        }

        if (aiLogs.length > 0) {
            let aiText = '';
            aiLogs.forEach(log => {
                const date = new Date(log.timestamp).toLocaleDateString();
                aiText += `**AI Filter** - ${log.reason} (${date})\n`;
            });
            embed.addFields({ name: 'AI Filter Flags', value: aiText });
        }

        message.reply({ embeds: [embed] });
    }
};