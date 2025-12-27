const { EmbedBuilder } = require('discord.js');
const { getEmoji } = require('../utils/emojis');
const { canUseCommand } = require('../utils/permissions');

module.exports = {
    category: "Security",
    name: 'ohelp',
    description: 'Display global owner-only commands',
    category: 'Owner',
    ownerOnly: true,
    hidden: true,
    async execute(message, args, client) {
        // Strict global owner check using permission helper
        if (!canUseCommand(message.member, this, {})) {
            return message.reply(`${getEmoji('ERROR')} You are not allowed to use this command.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`${getEmoji('INFO')} Spectre Owner Commands`)
            .setColor('#5865F2')
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Global Owner Console' });

        const ownerCommands = client.commands.filter(cmd => 
            (cmd.ownerOnly === true || cmd.devOnly === true) && cmd.hidden !== true
        );

        if (ownerCommands.size === 0) {
            embed.setDescription('No owner-only commands found.');
        } else {
            let cmdList = '';
            ownerCommands.forEach(cmd => {
                const aliasStr = cmd.aliases ? ` (aliases: \`${cmd.aliases.join(', ')}\`)` : '';
                cmdList += `\`s!${cmd.name}\`${aliasStr} - ${cmd.description}\n`;
            });
            embed.addFields({ name: 'Restricted Commands', value: cmdList.slice(0, 1024) });
        }

        return message.reply({ embeds: [embed] });
    }
};
