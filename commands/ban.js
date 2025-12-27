const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    category: "Moderation",
    category: "Security",
    name: 'ban',
    aliases: ['b'],
    description: 'Ban a member',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('You do not have permission to use this command.');
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('Please mention a user to ban.');
        if (!target.bannable) return message.reply('I cannot ban this user.');

        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        const logEmbed = new EmbedBuilder()
            .setTitle(`${getEmoji('BAN')} Member Banned`)
            .setColor('#FF0000')
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
            return message.reply(`[DEV MODE] Would have banned **${target.user.tag}** | Reason: ${reason}`);
        }

        try {
            await target.send({ content: `You have been banned from **${message.guild.name}**.`, embeds: [logEmbed] });
        } catch (e) {}

        await target.ban({ reason });

        db.prepare('INSERT INTO cases (guild_id, user_id, moderator_id, action, reason) VALUES (?, ?, ?, ?, ?)').run(message.guild.id, target.id, message.author.id, 'BAN', reason);

        const { logEvent } = require('../utils/logger');
        await logEvent(message.guild, logEmbed, 'normal');

        message.reply(`Banned **${target.user.tag}** | Reason: ${reason}`);
    }
};