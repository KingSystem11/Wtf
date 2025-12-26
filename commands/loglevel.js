const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'loglevel',
    description: 'Set the security event log level',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Administrators only.');
        }

        const level = args[0]?.toLowerCase();
        const supported = ['low', 'normal', 'high'];

        if (!supported.includes(level)) {
            return message.reply(`Usage: \`s!loglevel <low|normal|high>\``);
        }

        db.prepare('UPDATE guild_config SET log_level = ? WHERE guild_id = ?').run(level, message.guild.id);
        
        const description = {
            low: 'Only critical events (Panic, Anti-Nuke, Anti-Raid) will be logged.',
            normal: 'Standard security events will be logged.',
            high: 'All events, including config changes and command misuse, will be logged.'
        };

        message.reply(`✅ Log level set to **${level.toUpperCase()}**.\n${description[level]}`);
    }
};