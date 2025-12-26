const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'warn',
    description: 'Warn a member',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('You do not have permission to use this command.');
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('Please mention a user to warn.');

        const reason = args.slice(1).join(' ') || 'No reason provided';

        const logEmbed = new EmbedBuilder()
            .setTitle('⚠️ Member Warned')
            .setColor('#FFFF00')
            .addFields(
                { name: 'Server', value: message.guild.name },
                { name: 'Target', value: `${target.user.tag} (${target.id})` },
                { name: 'Moderator', value: message.author.tag },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        try {
            await target.send({ content: `You have been warned in **${message.guild.name}**.`, embeds: [logEmbed] });
        } catch (e) {}

        db.prepare('INSERT INTO cases (guild_id, user_id, moderator_id, action, reason) VALUES (?, ?, ?, ?, ?)').run(message.guild.id, target.id, message.author.id, 'WARN', reason);

        const { logEvent } = require('../utils/logger');
        await logEvent(message.guild, logEmbed, 'normal');

        message.reply(`Warned **${target.user.tag}** | Reason: ${reason}`);
    }
};