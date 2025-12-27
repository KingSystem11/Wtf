const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    category: "Security",
    name: 'lock',
    description: 'Lock the current channel',
    async execute(message) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('You do not have permission to use this command.');
        
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: false
            });
            message.reply('🔒 Channel has been locked.');
        } catch (error) {
            message.reply('Could not lock the channel.');
        }
    }
};