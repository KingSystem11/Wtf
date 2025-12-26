const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'resetall',
    description: 'Resets all configurations for this guild (Owner Only)',
    ownerOnly: true,
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ Only the server owner can reset all settings.');
        }

        if (args[0] !== 'CONFIRM') {
            return message.reply('⚠️ **DANGER:** This will wipe all guild settings (prefix, roles, channels, modules). Type `s!resetall CONFIRM` to proceed.');
        }

        const config = db.prepare('SELECT log_channel, prefix FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        const defaultPrefix = require('../config.json').prefix;

        db.prepare('DELETE FROM guild_config WHERE guild_id = ?').run(message.guild.id);
        db.prepare('DELETE FROM whitelist WHERE guild_id = ?').run(message.guild.id);
        db.prepare('DELETE FROM command_usage WHERE guild_id = ?').run(message.guild.id);
        
        // Re-insert safe defaults immediately
        db.prepare(`
            INSERT INTO guild_config (guild_id, prefix, antispam, antilink, antiraid, antinuke, aifilter)
            VALUES (?, ?, 1, 0, 0, 0, 0)
        `).run(message.guild.id, defaultPrefix);

        const embed = new EmbedBuilder()
            .setTitle('🧨 Factory Reset Complete')
            .setColor('#FF0000')
            .setDescription('All guild configurations have been wiped and reset to factory defaults.')
            .setTimestamp();

        message.reply({ embeds: [embed] });

        if (config?.log_channel) {
            const channel = message.guild.channels.cache.get(config.log_channel);
            if (channel) channel.send({ embeds: [embed] });
        }
    }
};