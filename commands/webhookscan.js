const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    category: "Security",
    name: 'webhookscan',
    description: 'Scans the server for all webhooks and highlights suspicious ones',
    async execute(message) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
            return message.reply('❌ You do not have permission to manage webhooks.');
        }

        try {
            const webhooks = await message.guild.fetchWebhooks();
            if (webhooks.size === 0) return message.reply('✅ No webhooks found in this server.');

            const embed = new EmbedBuilder()
                .setTitle('🕸️ Webhook Security Scan')
                .setColor('#00FF00')
                .setTimestamp();

            const channels = {};
            webhooks.forEach(wh => {
                if (!channels[wh.channelId]) channels[wh.channelId] = [];
                channels[wh.channelId].push(wh);
            });

            let scanResults = '';
            for (const [channelId, whList] of Object.entries(channels)) {
                scanResults += `\n**Channel:** <#${channelId}>\n`;
                whList.forEach(wh => {
                    const isSuspicious = !wh.avatar || !wh.owner;
                    const status = isSuspicious ? '⚠️ **SUSPICIOUS**' : '✅ Safe';
                    scanResults += `• \`${wh.name}\` (ID: ${wh.id}) - ${status}\n`;
                });
            }

            embed.setDescription(scanResults.substring(0, 4000));
            message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Webhook scan error:', err);
            message.reply('❌ Failed to fetch webhooks.');
        }
    }
};