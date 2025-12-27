const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    category: "Security",
    category: "Security",
    name: 'antispam',
    description: 'Configure anti-spam protection',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('You do not have permission.');
        
        const sub = args[0]?.toLowerCase();
        if (sub === 'on' || sub === 'off') {
            const value = sub === 'on' ? 1 : 0;
            db.prepare('INSERT INTO guild_config (guild_id, antispam) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET antispam = EXCLUDED.antispam').run(message.guild.id, value);
            return message.reply(`${getEmoji('SPAM')} Anti-spam has been turned **${sub.toUpperCase()}**.`);
        }

        if (sub === 'config') {
            const max = parseInt(args[1]);
            const sec = parseInt(args[2]);
            if (isNaN(max) || isNaN(sec)) return message.reply('Usage: s!antispam config <maxMessages> <seconds>');

            db.prepare('INSERT INTO guild_config (guild_id, max_messages, interval) VALUES (?, ?, ?) ON CONFLICT(guild_id) DO UPDATE SET max_messages = EXCLUDED.max_messages, interval = EXCLUDED.interval').run(message.guild.id, max, sec);
            return message.reply(`${getEmoji('SETTINGS')} Anti-spam config updated: **${max}** messages in **${sec}** seconds.`);
        }

        message.reply('Usage:\n`s!antispam <on/off>`\n`s!antispam config <maxMessages> <seconds>`');
    }
};