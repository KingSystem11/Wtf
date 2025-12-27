const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    category: "Moderation",
    category: "Security",
    name: 'kick',
    description: 'Kick a member',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('You do not have permission to use this command.');
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('Please mention a user to kick.');
        if (!target.kickable) return message.reply('I cannot kick this user.');

        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        const logEmbed = new EmbedBuilder()
            .setTitle(`${getEmoji('KICK')} Member Kicked`)
            .setColor('#FFA500')
            .addFields(
                { name: 'Server', value: message.guild.name },
                { name: 'Target', value: `${target.user.tag} (${target.id})` },
                { name: 'Moderator', value: message.author.tag },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        const devMode = process.env.SPECTRE_DEV_MODE === 'true';
        const testGuilds = process.env.TEST_GUILD_IDS ? process.env.TEST_GUILD_IDS.split(',') : [];
        const isTestGuild = testGuilds.includes(message.guild.id);

        if (devMode && !isTestGuild) {
            return message.reply(`[DEV MODE] Would have kicked **${target.user.tag}** | Reason: ${reason}`);
        }

        try {
            await target.send({ content: `You have been kicked from **${message.guild.name}**.`, embeds: [logEmbed] });
        } catch (e) {}

        await target.kick(reason);

        db.prepare('INSERT INTO cases (guild_id, user_id, moderator_id, action, reason) VALUES (?, ?, ?, ?, ?)').run(message.guild.id, target.id, message.author.id, 'KICK', reason);

        const { logEvent } = require('../utils/logger');
        await logEvent(message.guild, logEmbed, 'normal');

        message.reply(`Kicked **${target.user.tag}** | Reason: ${reason}`);
    }
};