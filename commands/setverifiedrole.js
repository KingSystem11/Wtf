const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'setverifiedrole',
    description: 'Set the role given to verified users',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Administrators only.');
        }

        const role = message.mentions.roles.first();
        if (!role) return message.reply('Please mention a role.');

        db.prepare('UPDATE guild_config SET verified_role_id = ? WHERE guild_id = ?').run(role.id, message.guild.id);
        message.reply(`✅ Verified role set to <@&${role.id}>.`);
    }
};