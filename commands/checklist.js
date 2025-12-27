const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    category: "Security",
    name: 'checklist',
    description: 'Security checklist for guild owners',
    highRisk: true,
    async execute(message, args, client) {
        // Owner only per guild
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ Only the server owner can run this command.');
        }

        const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        if (!config) {
            return message.reply('❌ No configuration found. Please run `s!setupsecurity` first.');
        }

        const successEmoji = getEmoji('SUCCESS') || '✅';
        const errorEmoji = getEmoji('ERROR') || '❌';
        const infoEmoji = getEmoji('INFO') || 'ℹ️';

        const checks = [
            {
                name: 'Log Channel',
                status: !!config.log_channel,
                tip: 'Set one using `s!setlog #channel`'
            },
            {
                name: 'Anti-Spam',
                status: !!config.antispam,
                tip: 'Enable using `s!antispam on`'
            },
            {
                name: 'Anti-Link',
                status: !!config.antilink,
                tip: 'Enable using `s!antilink on`'
            },
            {
                name: 'Anti-Raid',
                status: !!config.antiraid,
                tip: 'Enable using `s!antiraid on`'
            },
            {
                name: 'Anti-Nuke',
                status: !!config.antinuke,
                tip: 'Enable using `s!antinuke on`'
            },
            {
                name: 'Staff Role',
                status: !!config.staff_role_id,
                tip: 'Set one using `s!setstaffrole @role`'
            },
            {
                name: 'Verification Level',
                status: message.guild.verificationLevel >= 2, // Medium or higher
                tip: 'Set to Medium+ in Server Settings'
            }
        ];

        let description = '## 🛡️ Server Security Checklist\n\n';
        checks.forEach(check => {
            const icon = check.status ? successEmoji : errorEmoji;
            description += `${icon} **${check.name}**\n${!check.status ? `└─ ${check.tip}\n` : ''}`;
        });

        description += `\n${infoEmoji} **Pro Tip:** Enable **2FA Requirement for Moderation** in your Server Settings to prevent admin account takeovers.`;

        // Beast Mode Status
        const premiumEmoji = getEmoji('PREMIUM') || '⭐';
        const warnEmoji = getEmoji('WARN') || '⚠️';
        const premium = db.prepare('SELECT expires_at FROM premium_guilds WHERE guild_id = ?').get(message.guild.id);
        const isPremium = premium && (new Date(premium.expires_at) > new Date());
        
        if (isPremium) {
            const beastStatus = config.beast_enabled ? successEmoji : errorEmoji;
            description += `\n\n${premiumEmoji} **Beast Mode (Premium):**\n`;
            description += `${beastStatus} Status: ${config.beast_enabled ? '✅ **ENABLED**' : '❌ **DISABLED**'}\n`;
            description += `• Ban Limit: \`${config.beast_limit_ban} per 10m\`\n`;
            description += `• Kick Limit: \`${config.beast_limit_kick} per 10m\`\n`;
            description += `• @everyone Limit: \`${config.beast_limit_everyone} per 10m\`\n`;
            if (!config.beast_enabled) description += `${warnEmoji} Enable with: \`s!beastmode enable\``;
        } else {
            description += `\n\n${premiumEmoji} **Beast Mode (Premium):**\n`;
            description += `${warnEmoji} Not available - **PREMIUM REQUIRED**\n`;
            description += `Use \`s!premium\` to upgrade your server.`;
        }

        // Add Extra Owners and Whitelist status
        const extraOwners = db.all('SELECT user_id FROM extra_owners WHERE guild_id = ?', [message.guild.id]);
        const whitelistEntries = db.all('SELECT target_id FROM whitelist WHERE guild_id = ?', [message.guild.id]);

        description += `\n\n**🛡️ Advanced Access:**\n• Extra Owners: \`${extraOwners.length}\`\n• Whitelist Entries: \`${whitelistEntries.length}\``;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Spectre Security Checklist')
            .setColor(checks.every(c => c.status) ? 0x00FF00 : 0xFFAA00)
            .setDescription(description)
            .setFooter({ text: '👻 Spectre Security | Securing your Discord' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
