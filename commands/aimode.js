const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'aimode',
    description: 'Set AI filter sensitivity mode',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Administrators only.');
        }

        const mode = args[0]?.toLowerCase();
        const supported = ['lenient', 'normal', 'aggressive'];

        if (!supported.includes(mode)) {
            return message.reply(`Usage: \`s!aimode <lenient|normal|aggressive>\``);
        }

        db.prepare('UPDATE guild_config SET ai_mode = ? WHERE guild_id = ?').run(mode, message.guild.id);
        
        const description = {
            lenient: 'Only extreme threats are logged. No deletions.',
            normal: 'Threats are deleted and logged.',
            aggressive: 'Strict filtering. Threats are deleted and users are muted.'
        };

        message.reply(`✅ AI sensitivity set to **${mode.toUpperCase()}**.\n${description[mode]}`);
    }
};