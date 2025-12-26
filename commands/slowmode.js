const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'slowmode',
    description: 'Set channel slowmode',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('You do not have permission to use this command.');
        
        const seconds = parseInt(args[0]);
        if (isNaN(seconds)) return message.reply('Please provide a number of seconds.');

        try {
            await message.channel.setRateLimitPerUser(seconds);
            message.reply(`⏱️ Slowmode set to ${seconds} seconds.`);
        } catch (error) {
            message.reply('Could not set slowmode.');
        }
    }
};