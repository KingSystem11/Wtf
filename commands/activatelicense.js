const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'activatelicense',
    description: 'Activates a premium license for this server',
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ Only the server owner can activate licenses.');
        }

        const key = args[0];
        if (!key) return message.reply('Usage: s!activatelicense <key>');

        const license = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key);
        if (!license) return message.reply('❌ Invalid license key.');

        const usage = db.prepare('SELECT COUNT(*) as count FROM premium_guilds WHERE license_key = ?').get(key);
        if (usage.count >= license.max_guilds) {
            return message.reply('❌ This license has reached its maximum guild limit.');
        }

        try {
            db.prepare('INSERT INTO premium_guilds (guild_id, license_key) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET license_key = EXCLUDED.license_key').run(message.guild.id, key);
            
            const embed = new EmbedBuilder()
                .setTitle('⭐ Premium Activated')
                .setDescription('This server now has access to all Spectre Premium features!')
                .setColor('#00FF00')
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (e) {
            message.reply('❌ Error activating license.');
        }
    }
};