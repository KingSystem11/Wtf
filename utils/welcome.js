const { EmbedBuilder } = require('discord.js');

/**
 * Send a welcome message to guild owner when bot joins
 * @param {Guild} guild - The guild the bot joined
 */
async function sendWelcomeMessage(guild) {
    try {
        // Build the welcome embed
        const embed = new EmbedBuilder()
            .setTitle('👻 Welcome to Spectre')
            .setDescription('Advanced moderation and security bot for Discord.')
            .addFields(
                {
                    name: '🚀 Quick Start',
                    value: '`s!start` - Initial setup wizard\n`s!checklist` - Security configuration checklist\n`s!preset` - Apply security presets (soft/balanced/max)'
                },
                {
                    name: '📚 Learn More',
                    value: '`s!securitydocs` - Full documentation\n`s!help` - Available commands'
                },
                {
                    name: '⭐ Premium Features',
                    value: 'Beast Mode, AI content filtering, and more require a premium subscription.'
                }
            )
            .setColor(0x7B2CBF)
            .setFooter({ text: 'Type s!help for the full command list' })
            .setTimestamp();

        // Try to DM the guild owner first
        try {
            const owner = await guild.fetchOwner();
            if (owner && owner.user) {
                await owner.user.send({ embeds: [embed] });
                console.log(`[Welcome] Sent welcome DM to owner of ${guild.name} (${guild.id})`);
                return;
            }
        } catch (dmError) {
            console.log(`[Welcome] Could not DM owner of ${guild.name}, trying system channel...`);
        }

        // Fallback: Try system channel
        if (guild.systemChannel && guild.systemChannel.permissionsFor(guild.members.me).has('SendMessages')) {
            await guild.systemChannel.send({ embeds: [embed] });
            console.log(`[Welcome] Sent welcome message to system channel of ${guild.name} (${guild.id})`);
            return;
        }

        // Last resort: Try to find any channel
        const firstChannel = guild.channels.cache.find(ch => 
            ch.isTextBased() && ch.permissionsFor(guild.members.me).has('SendMessages')
        );

        if (firstChannel) {
            await firstChannel.send({ embeds: [embed] });
            console.log(`[Welcome] Sent welcome message to ${firstChannel.name} in ${guild.name} (${guild.id})`);
        }
    } catch (error) {
        console.error(`[Welcome] Failed to send welcome message for guild ${guild.id}:`, error.message);
    }
}

module.exports = { sendWelcomeMessage };
