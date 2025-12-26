const { getGuildStatus } = require('../utils/status');

module.exports = {
    name: 'jsonstatus',
    description: 'Get JSON status summary (owner only)',
    async execute(message, args) {
        // Owner-only check
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ Guild owner only.');
        }

        try {
            const status = getGuildStatus(message.guild);
            
            if (!status) {
                return message.reply('❌ Failed to fetch status.');
            }

            const json = JSON.stringify(status, null, 2);
            
            // Ensure it fits in one message (2000 char limit)
            if (json.length > 1900) {
                return message.reply('⚠️ Status data too large. Contact bot owner.');
            }

            message.reply(`\`\`\`json\n${json}\n\`\`\``);
        } catch (err) {
            console.error('jsonstatus error:', err);
            message.reply('❌ Error generating status.');
        }
    }
};
