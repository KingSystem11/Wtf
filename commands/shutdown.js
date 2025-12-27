const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'shutdown',
    description: 'Gracefully shuts down the bot (Global Owner Only)',
    ownerOnly: true,
    async execute(message, args, client) {
        const botOwnerId = process.env.BOT_OWNER_ID;
        if (!botOwnerId) return message.reply('❌ BOT_OWNER_ID environment variable is not set.');
        
        if (message.author.id !== botOwnerId) {
            return message.reply('❌ This command is restricted to the global bot owner.');
        }

        const embed = new EmbedBuilder()
            .setTitle('🛑 Bot Shutting Down')
            .setColor('#FF0000')
            .setDescription('Spectre is performing a graceful shutdown. All security systems will be offline.')
            .setTimestamp();

        await message.reply({ embeds: [embed] });

        // Log to log channel if available
        const config = db.prepare('SELECT log_channel FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        if (config?.log_channel) {
            const channel = message.guild.channels.cache.get(config.log_channel);
            if (channel) await channel.send({ embeds: [embed] });
        }

        console.log('Shutdown initiated by owner.');
        client.destroy();
        process.exit(0);
    }
};