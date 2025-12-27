const { EmbedBuilder } = require('discord.js');

module.exports = {
    category: "Security",
    name: 'devstatus',
    description: 'Shows the current development mode status (Owner Only)',
    ownerOnly: true,
    async execute(message, args, client) {
        const botOwnerId = process.env.BOT_OWNER_ID;
        if (!botOwnerId || message.author.id !== botOwnerId) {
            return message.reply('❌ This command is restricted to the global bot owner.');
        }

        const devMode = process.env.SPECTRE_DEV_MODE === 'true';
        const testGuilds = process.env.TEST_GUILD_IDS ? process.env.TEST_GUILD_IDS.split(',') : [];

        const embed = new EmbedBuilder()
            .setTitle('🛠️ Development Mode Status')
            .setColor(devMode ? '#FFA500' : '#00FF00')
            .addFields(
                { name: 'Status', value: devMode ? '🟠 ENABLED (Safety On)' : '🟢 DISABLED (Live Mode)', inline: true },
                { name: 'Test Guilds', value: testGuilds.length > 0 ? testGuilds.map(id => `\`${id}\``).join(', ') : 'None configured', inline: false }
            )
            .setFooter({ text: 'Spectre Developer Tools' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};