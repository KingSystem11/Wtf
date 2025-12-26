const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checklist')
        .setDescription('Security checklist for guild owners'),
    
    async execute(interaction) {
        // Owner only per guild
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: '❌ Only the server owner can run this command.', ephemeral: true });
        }

        const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(interaction.guildId);
        if (!config) {
            return interaction.reply({ content: '❌ No configuration found. Please run `/setupsecurity` first.', ephemeral: true });
        }

        const successEmoji = getEmoji('SUCCESS') || '✅';
        const errorEmoji = getEmoji('ERROR') || '❌';
        const infoEmoji = getEmoji('INFO') || 'ℹ️';

        const checks = [
            {
                name: 'Log Channel',
                status: !!config.log_channel,
                tip: 'Set one using `/setlog`'
            },
            {
                name: 'Anti-Spam',
                status: !!config.antispam,
                tip: 'Enable using `/antispam`'
            },
            {
                name: 'Anti-Link',
                status: !!config.antilink,
                tip: 'Enable using `/antilink`'
            },
            {
                name: 'Anti-Raid',
                status: !!config.antiraid,
                tip: 'Enable using `/antiraid`'
            },
            {
                name: 'Anti-Nuke',
                status: !!config.antinuke,
                tip: 'Enable using `/antinuke`'
            },
            {
                name: 'Staff Role',
                status: !!config.staff_role_id,
                tip: 'Set one using `/setstaffrole`'
            },
            {
                name: 'Verification Level',
                status: interaction.guild.verificationLevel >= 2,
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
        const premium = db.prepare('SELECT expires_at FROM premium_guilds WHERE guild_id = ?').get(interaction.guildId);
        const isPremium = premium && (new Date(premium.expires_at) > new Date());
        
        if (isPremium) {
            const beastStatus = config.beast_enabled ? successEmoji : errorEmoji;
            description += `\n\n${premiumEmoji} **Beast Mode (Premium):**\n`;
            description += `${beastStatus} Status: ${config.beast_enabled ? '✅ **ENABLED**' : '❌ **DISABLED**'}\n`;
            description += `• Ban Limit: \`${config.beast_limit_ban} per 10m\`\n`;
            description += `• Kick Limit: \`${config.beast_limit_kick} per 10m\`\n`;
            description += `• @everyone Limit: \`${config.beast_limit_everyone} per 10m\`\n`;
            if (!config.beast_enabled) description += `${warnEmoji} Enable with: \`/beastmode enable\``;
        } else {
            description += `\n\n${premiumEmoji} **Beast Mode (Premium):**\n`;
            description += `${warnEmoji} Not available - **PREMIUM REQUIRED**`;
        }

        // Add Extra Owners and Whitelist status
        const extraOwners = db.all('SELECT user_id FROM extra_owners WHERE guild_id = ?', [interaction.guildId]);
        const whitelistEntries = db.all('SELECT target_id FROM whitelist WHERE guild_id = ?', [interaction.guildId]);

        description += `\n\n**🛡️ Advanced Access:**\n• Extra Owners: \`${extraOwners.length}\`\n• Whitelist Entries: \`${whitelistEntries.length}\``;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Spectre Security Checklist')
            .setColor(checks.every(c => c.status) ? 0x00FF00 : 0xFFAA00)
            .setDescription(description)
            .setFooter({ text: '👻 Spectre Security | Securing your Discord' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
