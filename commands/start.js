const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    category: "Security",
    name: 'start',
    description: 'Onboarding summary for server owners',
    async execute(message, args, client) {
        const isOwner = message.author.id === message.guild.ownerId;
        
        if (!isOwner) {
            return message.reply(`${getEmoji('WARN')} Only the server owner can view the full setup summary.`);
        }

        const config = db.prepare('SELECT antinuke, antiraid, antispam, antilink, aifilter, log_channel FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        
        // Security logic integrated from securitylevel.js
        const features = [
            { name: 'Anti-Nuke', active: !!config?.antinuke },
            { name: 'Anti-Raid', active: !!config?.antiraid },
            { name: 'Anti-Spam', active: !!config?.antispam },
            { name: 'Anti-Link', active: !!config?.antilink },
            { name: 'AI Filter', active: !!config?.aifilter }
        ];

        const activeCount = features.filter(f => f.active).length;
        let level = 'LOW';
        let color = '#FF0000';
        if (activeCount >= 4) {
            level = 'HIGH';
            color = '#00FF00';
        } else if (activeCount >= 2) {
            level = 'MEDIUM';
            color = '#FFA500';
        }

        const embed = new EmbedBuilder()
            .setTitle(`${getEmoji('SECURITY')} Spectre Onboarding Summary`)
            .setColor(color)
            .setDescription(`Welcome! Here is your server's current status and recommended next steps.`)
            .addFields(
                { name: 'Current Security Level', value: `**${level}** (${activeCount}/${features.length} Features Active)`, inline: false },
                { name: '🚀 Recommended Steps', value: 
                    `• **Set Log Channel:** Use \`s!setlog #channel\`\n` +
                    `• **Enable Anti-Nuke:** Use \`s!antinuke on\`\n` +
                    `• **Enable Anti-Raid:** Use \`s!antiraid on\`\n` +
                    `• **Run Setup:** Use \`s!setupsecurity\` for guided config` 
                },
                { name: '📚 Useful Commands', value: 
                    `• \`s!help\` - View all commands\n` +
                    `• \`s!ohelp\` - Global owner commands\n` +
                    `• \`s!privacy\` - Data privacy info` 
                }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: '👻 Spectre | Your server, secured.' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
