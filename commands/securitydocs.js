const { EmbedBuilder } = require('discord.js');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    category: "Security",
    name: 'securitydocs',
    description: 'Security features documentation',
    async execute(message, args) {
        const securityEmoji = getEmoji('SECURITY') || '🛡️';
        const premiumEmoji = getEmoji('PREMIUM') || '⭐';
        const warnEmoji = getEmoji('WARN') || '⚠️';
        const infoEmoji = getEmoji('INFO') || 'ℹ️';

        const embed = new EmbedBuilder()
            .setTitle(`${securityEmoji} Spectre Security Documentation`)
            .setColor(0x5865F2)
            .addFields(
                {
                    name: `${premiumEmoji} Beast Mode`,
                    value: `**What it is:** Protects against betrayal from trusted staff by monitoring whitelisted users for suspicious mass actions (bans, kicks, @everyone mentions).\n\n**Premium-Only:** Beast Mode is exclusively available on premium servers.\n\n**Whitelisted Users Still Watched:** Even whitelisted users are monitored. If they exceed the configured limits, their dangerous permissions are automatically revoked.`,
                    inline: false
                },
                {
                    name: `${securityEmoji} Whitelist System`,
                    value: `**Module-Based Exemptions:** The whitelist is NOT a full bypass. Members can be whitelisted from specific modules:\n• **Anti-Link** - Bypass link/invite filters\n• **Anti-Spam** - Bypass message frequency limits\n• **Anti-Mention-Everyone** - Bypass @everyone/@here restrictions\n• **Anti-Raid** - Bypass join frequency limits\n• **Anti-Nuke** - Bypass administrative action limits\n\nWhitelisted users still trigger all other security systems.`,
                    inline: false
                },
                {
                    name: `${warnEmoji} Critical Limitation`,
                    value: `**Beast Mode Cannot Be Whitelisted:** No user can be whitelisted from Beast Mode. All administrative users are always monitored to prevent server takeover attempts.`,
                    inline: false
                },
                {
                    name: `${infoEmoji} Need More Help?`,
                    value: `Use \`s!beastmode\` to view Beast Mode settings, or \`s!checklist\` for a complete security overview.`,
                    inline: false
                }
            )
            .setFooter({ text: '👻 Spectre Security | Protecting your Discord' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
