const { EmbedBuilder } = require('discord.js');
const { getEmoji } = require('../utils/emojis');
const { getSlowCommands } = require('../utils/metrics');

module.exports = {
    category: "Security",
    name: 'slowcmds',
    description: 'Displays the last 20 slow commands (Owner Only)',
    category: 'Owner',
    ownerOnly: true,
    async execute(message, args, client) {
        const botOwnerId = process.env.BOT_OWNER_ID;
        if (message.author.id !== botOwnerId) {
            return message.reply(`${getEmoji('ERROR')} This command is restricted to the global bot owner.`);
        }

        const slowLogs = getSlowCommands();

        const embed = new EmbedBuilder()
            .setTitle(`${getEmoji('REPORT')} Slow Command Diagnostics`)
            .setColor('#FFA500')
            .setTimestamp()
            .setFooter({ text: 'Performance Metrics' });

        if (slowLogs.length === 0) {
            embed.setDescription('No slow commands recorded yet.');
        } else {
            const list = slowLogs.map((log, i) => {
                const timeStr = log.timestamp.toLocaleTimeString();
                return `**${i + 1}.** \`s!${log.name}\` - **${log.duration}ms** [${timeStr}]`;
            }).join('\n');
            embed.setDescription(list);
        }

        return message.reply({ embeds: [embed] });
    }
};
