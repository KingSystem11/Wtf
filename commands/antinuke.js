const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    category: "Security",
    category: "Security",
    name: 'antinuke',
    aliases: ['an'],
    description: 'Configure executor-based anti-nuke protection',
    highRisk: true,
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('You do not have permission.');
        
        const sub = args[0]?.toLowerCase();
        if (sub === 'on' || sub === 'off') {
            const value = sub === 'on' ? 1 : 0;
            db.prepare('INSERT INTO guild_config (guild_id, antinuke) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET antinuke = EXCLUDED.antinuke').run(message.guild.id, value);
            return message.reply(`${getEmoji('NUKE')} Anti-nuke has been turned **${sub.toUpperCase()}**.`);
        }

        if (sub === 'config') {
            const limit = parseInt(args[1]);
            const window = parseInt(args[2]);
            if (isNaN(limit) || isNaN(window)) return message.reply('Usage: s!antinuke config <maxActions> <windowSeconds>');

            db.prepare('INSERT INTO guild_config (guild_id, antinuke_limit, antinuke_window) VALUES (?, ?, ?) ON CONFLICT(guild_id) DO UPDATE SET antinuke_limit = EXCLUDED.antinuke_limit, antinuke_window = EXCLUDED.antinuke_window').run(message.guild.id, limit, window);
            return message.reply(`${getEmoji('SETTINGS')} Anti-nuke updated: **${limit}** actions in **${window}** seconds threshold.`);
        }

        message.reply('Usage:\n`s!antinuke <on/off>`\n`s!antinuke config <maxActions> <windowSeconds>`');
    }
};