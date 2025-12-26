const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'genlicense',
    description: 'Generates a new premium license key (Owner Only)',
    ownerOnly: true,
    async execute(message, args) {
        const botOwnerId = process.env.BOT_OWNER_ID;
        if (!botOwnerId || message.author.id !== botOwnerId) {
            return message.reply('❌ This command is restricted to the global bot owner.');
        }

        const key = args[0];
        const maxGuilds = parseInt(args[1]) || 1;

        if (!key) return message.reply('Usage: s!genlicense <key> <maxGuilds>');

        try {
            db.prepare('INSERT INTO licenses (key, max_guilds, created_by) VALUES (?, ?, ?)').run(key, maxGuilds, message.author.id);
            
            const embed = new EmbedBuilder()
                .setTitle('🎫 License Generated')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Key', value: `\`${key}\``, inline: true },
                    { name: 'Max Guilds', value: maxGuilds.toString(), inline: true }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (e) {
            message.reply('❌ Error: License key already exists.');
        }
    }
};