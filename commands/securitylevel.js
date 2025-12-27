const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    category: "Security",
    name: 'securitylevel',
    description: 'Summarizes the security posture for the guild',
    async execute(message, args) {
        const config = db.prepare('SELECT antinuke, antiraid, antispam, antilink, aifilter, log_channel FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        
        if (!config) {
            return message.reply(`${getEmoji('ERROR')} No configuration found for this server. Please set up the bot first.`);
        }

        const features = [
            { name: 'Anti-Nuke', active: !!config.antinuke },
            { name: 'Anti-Raid', active: !!config.antiraid },
            { name: 'Anti-Spam', active: !!config.antispam },
            { name: 'Anti-Link', active: !!config.antilink },
            { name: 'AI Filter', active: !!config.aifilter }
        ];

        const activeCount = features.filter(f => f.active).length;
        let level = 'LOW';
        let color = '#FF0000';
        let suggestions = [];

        if (activeCount >= 4) {
            level = 'HIGH';
            color = '#00FF00';
        } else if (activeCount >= 2) {
            level = 'MEDIUM';
            color = '#FFA500';
        }

        if (!config.antinuke) suggestions.push('Enable **Anti-Nuke** to prevent server destruction.');
        if (!config.antiraid) suggestions.push('Enable **Anti-Raid** to stop mass joins.');
        if (!config.log_channel) suggestions.push('Set a **Log Channel** to track security events.');
        if (!config.aifilter) suggestions.push('Activate **AI Filter** (Premium) for advanced toxicity protection.');

        const statusString = features.map(f => `${f.active ? getEmoji('SUCCESS') : getEmoji('ERROR')} ${f.name}`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`${getEmoji('SECURITY')} Security Posture Summary`)
            .setColor(color)
            .setThumbnail(message.guild.iconURL())
            .addFields(
                { name: 'Security Level', value: `**${level}** (${activeCount}/${features.length} Features Active)`, inline: false },
                { name: 'Module Status', value: statusString, inline: true },
                { name: 'Recommendations', value: suggestions.length > 0 ? suggestions.map(s => `• ${s}`).join('\n') : '✅ Your server is well-protected!', inline: false }
            )
            .setFooter({ text: '👻 Spectre Security Scan' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};