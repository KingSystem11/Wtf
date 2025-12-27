const { EmbedBuilder } = require('discord.js');
const { getGuildCount } = require('../utils/metrics');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Utility",
    category: "Security",
    name: 'info',
    description: 'Displays information about Spectre',
    async execute(message, args, client) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        const guildCount = await getGuildCount(client);

        // Fetch top commands for summary
        const topCommands = db.prepare('SELECT command_name, uses FROM command_usage WHERE guild_id = ? ORDER BY uses DESC LIMIT 3').all(message.guild.id);
        const topUsage = topCommands.length > 0 ? topCommands.map(c => `\`${c.command_name}\` (${c.uses})`).join(', ') : 'None';

        const infoEmbed = new EmbedBuilder()
            .setTitle('👻 About Spectre Security')
            .setColor('#00FF00')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription('Spectre is a high-performance Discord security bot designed to protect your community with multi-layered defense systems and AI-powered filtering.')
            .addFields(
                { name: '🤖 Bot Info', value: `**Name:** Spectre\n**Prefix:** \`s!\`\n**Version:** \`1.0.0\``, inline: true },
                { name: '📊 Statistics', value: `**Servers:** ${guildCount}\n**Uptime:** ${uptimeString}`, inline: true },
                { name: '🔥 Top Commands', value: topUsage, inline: false },
                { name: '🛡️ Key Features', value: '• **Moderation:** Advanced case management\n• **Anti-Nuke:** Executor-based detection\n• **Anti-Raid:** High-velocity join protection\n• **AI Filter:** Real-time toxic content removal\n• **Premium:** Feature gating & advanced configs' }
            )
            .setFooter({ text: '👻 Spectre Security | Securing your Discord' })
            .setTimestamp();

        message.reply({ embeds: [infoEmbed] });
    }
};