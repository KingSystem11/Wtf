const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'setlog',
    description: 'Set the logging channel',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('You do not have permission.');
        
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply('Please mention a channel.');

        db.prepare('INSERT INTO guild_config (guild_id, log_channel) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET log_channel = EXCLUDED.log_channel').run(message.guild.id, channel.id);
        
        message.reply(`✅ Log channel set to ${channel}`);
    }
};