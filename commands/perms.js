const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'perms',
    description: 'Show current security permissions',
    async execute(message) {
        const config = db.prepare('SELECT staff_role_id FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        const staffRole = config?.staff_role_id ? `<@&${config.staff_role_id}>` : '`None`';

        const embed = new EmbedBuilder()
            .setTitle('🔐 Security Permissions')
            .setColor('#00FF00')
            .setDescription('Who can use Spectre security/moderation commands:')
            .addFields(
                { name: 'Guild Owner', value: '✅ Always', inline: true },
                { name: 'Administrators', value: '✅ Always', inline: true },
                { name: 'Configured Staff Role', value: staffRole, inline: true }
            )
            .setFooter({ text: '👻 Spectre Security' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};