const { PermissionFlagsBits } = require('discord.js');
const { generateIncidentReport, formatIncidentEmbed } = require('../utils/incident');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    category: "Security",
    name: 'incident',
    description: 'Generate incident report for a user',
    async execute(message, args) {
        // Check permissions - staff/admin only
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers) && 
            !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Moderators only.');
        }

        // Get user
        let user = message.mentions.users.first();
        
        if (!user && args[0]) {
            // Try to fetch by ID
            try {
                user = await message.client.users.fetch(args[0]);
            } catch (e) {
                return message.reply('❌ User not found. Usage: `s!incident <@user or userId>`');
            }
        }

        if (!user) {
            return message.reply('Usage: `s!incident <@user or userId>`');
        }

        // Generate report
        const report = await generateIncidentReport(message.guild, user.id);
        
        if (!report) {
            return message.reply('❌ Failed to generate incident report.');
        }

        // Format and send embed
        const embed = formatIncidentEmbed(message.guild, user, report);
        
        message.reply({ embeds: [embed] });
    }
};
