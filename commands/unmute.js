const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Moderation",
    category: "Security",
    name: 'unmute',
    description: 'Remove timeout from a member',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('You do not have permission to use this command.');
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('Please mention a user to unmute.');

        try {
            await target.timeout(null);
            db.prepare('INSERT INTO cases (guild_id, user_id, moderator_id, action, reason) VALUES (?, ?, ?, ?, ?)').run(message.guild.id, target.id, message.author.id, 'UNMUTE', 'Manual unmute');
            message.reply(`Unmuted **${target.user.tag}**`);
        } catch (error) {
            message.reply('Could not unmute this user.');
        }
    }
};