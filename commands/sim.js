const { EmbedBuilder } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    name: 'sim',
    description: 'Simulates security events for testing (Owner Only)',
    ownerOnly: true,
    async execute(message, args, client) {
        const botOwnerId = process.env.BOT_OWNER_ID;
        if (!botOwnerId || message.author.id !== botOwnerId) {
            return message.reply('❌ This command is restricted to the global bot owner.');
        }

        const type = args[0]?.toLowerCase();
        if (!['raid', 'nuke', 'spam'].includes(type)) {
            return message.reply('Usage: `s!sim raid`, `s!sim nuke`, or `s!sim spam`');
        }

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTimestamp()
            .setFooter({ text: 'Spectre Simulation System' });

        switch (type) {
            case 'raid':
                embed.setTitle('🛡️ [SIMULATION] Anti-Raid Triggered')
                     .setDescription('A simulated mass join event was detected. In a real scenario, the server would be placed under lockdown.');
                await logEvent(message.guild, embed, 'critical');
                break;
            case 'nuke':
                embed.setTitle('☢️ [SIMULATION] Anti-Nuke Triggered')
                     .setDescription('A simulated unauthorized administrative action was detected. In a real scenario, the executor would be stripped of roles or banned.');
                await logEvent(message.guild, embed, 'critical');
                break;
            case 'spam':
                embed.setTitle('🚫 [SIMULATION] Anti-Spam Triggered')
                     .setDescription(`A simulated rapid message event by **${message.author.tag}** was detected. In a real scenario, the user would be muted.`);
                await logEvent(message.guild, embed, 'normal');
                break;
        }

        message.reply(`✅ Simulated **${type.toUpperCase()}** event. Check the logs for the reaction.`);
    }
};