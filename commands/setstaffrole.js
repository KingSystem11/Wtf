const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'setstaffrole',
    description: 'Set the role allowed to use security commands',
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You must be the owner or an administrator to use this command.');
        }
        
        const role = message.mentions.roles.first();
        if (!role) return message.reply('Please mention a role.');

        db.prepare('INSERT INTO guild_config (guild_id, staff_role_id) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET staff_role_id = EXCLUDED.staff_role_id').run(message.guild.id, role.id);
        
        message.reply(`✅ Staff role set to ${role.name}`);
    }
};