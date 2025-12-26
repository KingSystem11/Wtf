const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'privacy',
    description: 'Information about how Spectre handles your data',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🔒 Privacy & Data Information')
            .setColor('#00FF00')
            .setDescription('Spectre is designed with security and transparency in mind. Here is how we handle data:')
            .addFields(
                { 
                    name: '📋 Moderation Logs', 
                    value: 'We store basic information like User IDs, action types (ban, mute, etc.), and reasons provided by staff to maintain server accountability.' 
                },
                { 
                    name: '💬 Message Content', 
                    value: 'Spectre does not store message contents permanently. Content is only processed in real-time for security filtering and is discarded immediately after analysis.' 
                },
                { 
                    name: '🤖 AI Analysis', 
                    value: 'When AI filtering is enabled by administrators, content may be analyzed by OpenAI to detect harmful material. This data is not used for training and is handled according to enterprise privacy standards.' 
                },
                { 
                    name: '📂 Your Rights', 
                    value: 'Data is stored locally on this bot\'s server. You can use `s!why` to see exactly what moderation actions Spectre has recorded about you in this server.' 
                }
            )
            .setFooter({ text: 'Security, Privacy, Spectre.' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};