const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'health',
    description: 'System health check for external monitoring',
    async execute(message, args, client) {
        const botOwnerId = process.env.BOT_OWNER_ID;
        const healthSecret = process.env.HEALTH_SECRET;
        
        const providedSecret = args[0];
        const isAuthorized = (botOwnerId && message.author.id === botOwnerId) || (healthSecret && providedSecret === healthSecret);

        if (!isAuthorized) {
            return message.reply('❌ Unauthorized. Bot owner access or correct health secret required.');
        }

        let status = 'ok';
        let reason = '';

        // 1. Check Bot Connection
        if (!client.isReady()) {
            status = 'degraded';
            reason += 'Bot not ready. ';
        }

        // 2. Check Database Connection
        try {
            const result = db.prepare('SELECT 1').get();
            if (!result) {
                status = 'degraded';
                reason += 'DB query returned no result. ';
            }
        } catch (err) {
            status = 'degraded';
            reason += `DB connection error: ${err.message}. `;
        }

        const embed = new EmbedBuilder()
            .setTitle('🏥 System Health Status')
            .setColor(status === 'ok' ? '#00FF00' : '#FF0000')
            .addFields(
                { name: 'Status', value: `**${status.toUpperCase()}**`, inline: true },
                { name: 'Uptime', value: `\`${Math.floor(client.uptime / 1000)}s\``, inline: true }
            )
            .setTimestamp();

        if (reason) {
            embed.addFields({ name: 'Degraded Reason', value: reason });
        }

        return message.reply({ embeds: [embed] });
    }
};
