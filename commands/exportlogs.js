const { EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'exportlogs',
    description: 'Export security logs as a .txt file',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('You do not have permission.');
        
        const type = args[0]?.toLowerCase();
        if (!['ai', 'antinuke', 'antiraid'].includes(type)) {
            return message.reply('Usage: `s!exportlogs <ai/antinuke/antiraid>`');
        }

        let logs = [];
        let exportStr = `Spectre Security Export - ${type.toUpperCase()} LOGS\nGenerated: ${new Date().toISOString()}\n\n`;

        if (type === 'ai') {
            logs = db.prepare('SELECT * FROM ai_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT 50').all(message.guild.id);
            logs.forEach(log => {
                exportStr += `[${log.created_at}] ID: ${log.id} | User: ${log.user_id} | Risk: ${log.risk_score} | Action: ${log.action}\nContent: ${log.content}\n${'-'.repeat(50)}\n`;
            });
        } else if (type === 'antinuke') {
            logs = db.prepare('SELECT * FROM antinuke_cases WHERE guild_id = ? ORDER BY created_at DESC LIMIT 50').all(message.guild.id);
            logs.forEach(log => {
                exportStr += `[${log.created_at}] ID: ${log.id} | Executor: ${log.executor_id} | Type: ${log.type} | Count: ${log.count}\n${'-'.repeat(50)}\n`;
            });
        } else if (type === 'antiraid') {
            // Anti-raid logs are usually just alerts in the log channel, 
            // but we can fetch them if we had a dedicated table. 
            // For now, let's export from the cases table for generic moderation if requested, 
            // or just inform if no dedicated raid table exists.
            return message.reply('Anti-raid logs are currently real-time alerts only. Support for export coming soon.');
        }

        if (logs.length === 0) return message.reply('No logs found for this type.');

        const buffer = Buffer.from(exportStr, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `${type}_logs_export.txt` });

        message.reply({ content: `✅ Exported last ${logs.length} ${type.toUpperCase()} logs.`, files: [attachment] });
    }
};