const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'unban',
    description: 'Unban a member',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('You do not have permission to use this command.');
        
        const userId = args[0];
        if (!userId) return message.reply('Please provide a user ID to unban.');

        try {
            await message.guild.members.unban(userId);
            db.prepare('INSERT INTO cases (guild_id, user_id, moderator_id, action, reason) VALUES (?, ?, ?, ?, ?)').run(message.guild.id, userId, message.author.id, 'UNBAN', 'No reason provided');
            message.reply(`Unbanned user ID: **${userId}**`);
        } catch (error) {
            message.reply('Could not unban this user. Make sure the ID is correct.');
        }
    }
};