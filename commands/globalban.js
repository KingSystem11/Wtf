const { PermissionFlagsBits } = require('discord.js');
const { addGlobalBan, removeGlobalBan, getGlobalBan } = require('../utils/globalban');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

// Bot owner ID - can be set via environment variable
const BOT_OWNER_ID = process.env.BOT_OWNER_ID;

module.exports = {
    category: "Security",
    name: 'globalban',
    description: 'Manage global banlist across servers',
    async execute(message, args) {
        const subcommand = args[0]?.toLowerCase();

        // Handle toggle: s!globalban on/off
        if (subcommand === 'on' || subcommand === 'off') {
            if (message.author.id !== message.guild.ownerId && message.author.id !== BOT_OWNER_ID) {
                return message.reply('❌ Only guild owner can toggle global ban feature.');
            }

            const enabled = subcommand === 'on' ? 1 : 0;
            db.prepare('UPDATE guild_config SET globalban_enabled = ? WHERE guild_id = ?').run(enabled, message.guild.id);
            
            const status = enabled ? '✅ ON' : '❌ OFF';
            return message.reply(`${status} Global ban checking for this server.`);
        }

        // Handle add: s!globalban add @user <reason>
        if (subcommand === 'add') {
            // Only guild owner or bot owner can add
            if (message.author.id !== message.guild.ownerId && message.author.id !== BOT_OWNER_ID) {
                return message.reply('❌ Only guild owner can add global bans.');
            }

            const user = message.mentions.users.first();
            const reason = args.slice(2).join(' ') || 'No reason provided';

            if (!user) {
                return message.reply('Usage: `s!globalban add @user <reason>`');
            }

            const success = addGlobalBan(user.id, reason, message.guild.id);
            if (success) {
                message.reply(`✅ **${user.tag}** added to global ban list.\n**Reason**: ${reason}`);
            } else {
                message.reply('❌ Failed to add to global ban list.');
            }
            return;
        }

        // Handle remove: s!globalban remove @user
        if (subcommand === 'remove') {
            // Only guild owner or bot owner can remove
            if (message.author.id !== message.guild.ownerId && message.author.id !== BOT_OWNER_ID) {
                return message.reply('❌ Only guild owner can remove global bans.');
            }

            const user = message.mentions.users.first();
            if (!user) {
                return message.reply('Usage: `s!globalban remove @user`');
            }

            const success = removeGlobalBan(user.id);
            if (success) {
                message.reply(`✅ **${user.tag}** removed from global ban list.`);
            } else {
                message.reply('❌ User not found in global ban list.');
            }
            return;
        }

        // Handle info: s!globalban info @user
        if (subcommand === 'info') {
            const user = message.mentions.users.first();
            if (!user) {
                return message.reply('Usage: `s!globalban info @user`');
            }

            const ban = getGlobalBan(user.id);
            if (!ban) {
                return message.reply(`ℹ️ **${user.tag}** is not on the global ban list.`);
            }

            const embed = {
                title: '🌍 Global Ban Info',
                color: 0xFF0000,
                fields: [
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: false },
                    { name: 'Reason', value: ban.reason, inline: false },
                    { name: 'Added By Guild', value: ban.added_by_guild_id, inline: true },
                    { name: 'Date', value: new Date(ban.created_at).toLocaleString(), inline: true },
                ],
            };

            return message.reply({ embeds: [embed] });
        }

        // Show usage
        message.reply(
            '**Global Ban Commands:**\n' +
            '`s!globalban on` - Enable global ban checking\n' +
            '`s!globalban off` - Disable global ban checking\n' +
            '`s!globalban add @user <reason>` - Add to global ban list\n' +
            '`s!globalban remove @user` - Remove from global ban list\n' +
            '`s!globalban info @user` - Check global ban status\n\n' +
            '**Note**: Only guild owner and bot owner can manage bans.'
        );
    }
};
