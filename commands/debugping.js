const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'debugping',
    description: 'A simple debug command to verify the bot is responding.',
    aliases: ['dp'],
    data: new SlashCommandBuilder()
        .setName('debugping')
        .setDescription('A simple debug command to verify the bot is responding.'),
    async execute(messageOrInteraction, args, client) {
        const isSlash = !!messageOrInteraction.isChatInputCommand;
        const user = isSlash ? messageOrInteraction.user : messageOrInteraction.author;
        
        console.log(`debugping executed by ${user.tag}`);
        
        const content = 'Debug OK';
        
        if (isSlash) {
            await messageOrInteraction.reply({ content, ephemeral: false });
        } else {
            await messageOrInteraction.reply(content);
        }
    }
};
