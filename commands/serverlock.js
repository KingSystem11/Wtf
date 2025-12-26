const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'serverlock',
    description: 'Lock or unlock the entire server',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('You do not have permission to use this command.');
        
        const action = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(action)) return message.reply('Usage: s!serverlock <on/off>');

        const isLocking = action === 'on';
        
        try {
            await message.guild.roles.everyone.setPermissions(isLocking ? 
                message.guild.roles.everyone.permissions.remove(PermissionFlagsBits.SendMessages) :
                message.guild.roles.everyone.permissions.add(PermissionFlagsBits.SendMessages)
            );
            message.reply(isLocking ? '🔒 Server-wide lock enabled.' : '🔓 Server-wide lock disabled.');
        } catch (error) {
            message.reply('Could not update server permissions.');
        }
    }
};