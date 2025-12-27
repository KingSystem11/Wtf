const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'debugping',
    description: 'A simple debug command to verify the bot is responding.',
    data: new SlashCommandBuilder()
        .setName('debugping')
        .setDescription('A simple debug command to verify the bot is responding.'),
    async execute(messageOrInteraction, args, client) {
        // Handle both prefix and slash commands
        const isSlash = !!messageOrInteraction.isChatInputCommand;
        
        console.log('debugping executed');
        
        if (isSlash) {
            await messageOrInteraction.reply('Debug OK');
        } else {
            await messageOrInteraction.reply('Debug OK');
        }
    }
};
