const { PermissionFlagsBits } = require('discord.js');
const { setChannelOverride, getChannelOverrides, resetChannelOverrides } = require('../utils/channeloverrides');

module.exports = {
    name: 'chanset',
    description: 'Set per-channel filter overrides',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Administrators only.');
        }

        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'reset') {
            const channel = message.mentions.channels.first();
            if (!channel) {
                return message.reply('Usage: `s!chanset reset <#channel>`');
            }

            const success = resetChannelOverrides(message.guild.id, channel.id);
            if (success) {
                return message.reply(`✅ Reset all overrides for <#${channel.id}>. Now using guild-wide settings.`);
            } else {
                return message.reply('❌ Failed to reset channel overrides.');
            }
        }

        // Standard command: s!chanset <#channel> <setting> <on/off>
        const channel = message.mentions.channels.first();
        const setting = args[1]?.toLowerCase();
        const state = args[2]?.toLowerCase();

        if (!channel || !setting || !state) {
            return message.reply(
                '**Usage:**\n' +
                '`s!chanset <#channel> <antispam|antilink|aifilter> <on|off>`\n' +
                '`s!chanset reset <#channel>`'
            );
        }

        if (!['antispam', 'antilink', 'aifilter'].includes(setting)) {
            return message.reply('❌ Setting must be: `antispam`, `antilink`, or `aifilter`');
        }

        if (!['on', 'off'].includes(state)) {
            return message.reply('❌ State must be: `on` or `off`');
        }

        const isEnabled = state === 'on';
        const success = setChannelOverride(message.guild.id, channel.id, setting, isEnabled);

        if (success) {
            const status = isEnabled ? '✅ ON' : '❌ OFF';
            message.reply(`${status} ${setting.toUpperCase()} override set for <#${channel.id}>.`);
        } else {
            message.reply('❌ Failed to set channel override.');
        }
    }
};
