const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'Unlock the current channel',
    async execute(message) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('You do not have permission to use this command.');
        
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: null
            });
            message.reply('🔓 Channel has been unlocked.');
        } catch (error) {
            message.reply('Could not unlock the channel.');
        }
    }
};