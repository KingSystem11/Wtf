const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    category: "Moderation",
    category: "Security",
    name: 'mute',
    aliases: ['m'],
    description: 'Timeout a member',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('You do not have permission to use this command.');
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('Please mention a user to mute.');

        const duration = parseInt(args[1]) || 60; // default 60 mins
        const reason = args.slice(2).join(' ') || 'No reason provided';

        const logEmbed = new EmbedBuilder()
            .setTitle(`${getEmoji('MUTE')} Member Muted`)
            .setColor('#FFFF00')
            .addFields(
                { name: 'Server', value: message.guild.name },
                { name: 'Target', value: `${target.user.tag} (${target.id})` },
                { name: 'Moderator', value: message.author.tag },
                { name: 'Duration', value: `${duration} minutes` },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        try {
            await target.send({ content: `You have been muted in **${message.guild.name}**.`, embeds: [logEmbed] });
        } catch (e) {}

        try {
            await target.timeout(duration * 60 * 1000, reason);
            db.prepare('INSERT INTO cases (guild_id, user_id, moderator_id, action, reason) VALUES (?, ?, ?, ?, ?)').run(message.guild.id, target.id, message.author.id, 'MUTE', reason);
            
            const { logEvent } = require('../utils/logger');
            await logEvent(message.guild, logEmbed, 'normal');

            message.reply(`Muted **${target.user.tag}** for ${duration} minutes | Reason: ${reason}`);
        } catch (error) {
            message.reply('Could not mute this user.');
        }
    }
};