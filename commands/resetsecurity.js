const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'resetsecurity',
    description: 'Resets security settings to safe defaults (Owner Only)',
    ownerOnly: true,
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ Only the server owner can reset security settings.');
        }

        db.prepare(`
            UPDATE guild_config SET 
                antispam = 1,
                antilink = 0,
                antiraid = 0,
                antinuke = 0,
                aifilter = 0,
                panic_mode = 0,
                ai_mode = 'normal'
            WHERE guild_id = ?
        `).run(message.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Security Reset')
            .setColor('#FFA500')
            .setDescription('All security modules have been reset to safe defaults.\n- Anti-Spam: **ON**\n- All others: **OFF**')
            .setTimestamp();

        message.reply({ embeds: [embed] });

        const config = db.prepare('SELECT log_channel FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        if (config?.log_channel) {
            const channel = message.guild.channels.cache.get(config.log_channel);
            if (channel) channel.send({ embeds: [embed] });
        }
    }
};