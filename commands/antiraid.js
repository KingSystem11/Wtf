const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    name: 'antiraid',
    aliases: ['ar'],
    description: 'Configure join raid protection',
    highRisk: true,
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('You do not have permission.');
        
        const sub = args[0]?.toLowerCase();
        if (sub === 'on' || sub === 'off') {
            const value = sub === 'on' ? 1 : 0;
            db.prepare('INSERT INTO guild_config (guild_id, antiraid) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET antiraid = EXCLUDED.antiraid').run(message.guild.id, value);
            return message.reply(`${getEmoji('RAID')} Anti-raid has been turned **${sub.toUpperCase()}**.`);
        }

        if (sub === 'config') {
            const max = parseInt(args[1]);
            if (isNaN(max)) return message.reply('Usage: s!antiraid config <maxJoinsPerMinute>');

            db.prepare('INSERT INTO guild_config (guild_id, max_joins) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET max_joins = EXCLUDED.max_joins').run(message.guild.id, max);
            return message.reply(`${getEmoji('SETTINGS')} Anti-raid threshold set to **${max}** joins per minute.`);
        }

        message.reply('Usage:\n`s!antiraid <on/off>`\n`s!antiraid config <maxJoinsPerMinute>`');
    }
};