const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    category: "Security",
    name: 'requiredperms',
    description: 'Displays the minimal required permissions and recommended server security settings (Owner Only)',
    ownerOnly: true,
    async execute(message, args) {
        // Permission check
        const ownerId = process.env.BOT_OWNER_ID;
        if (message.author.id !== ownerId) {
            return message.reply('❌ This command is restricted to the bot owner.');
        }

        const permsList = config.required_permissions.map(p => `• \`${p}\``).join('\n');
        const intentsList = config.intents.map(i => `• \`${i}\``).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Spectre Least Privilege Documentation')
            .setColor(config.colors.default)
            .setDescription('Spectre follows the principle of **Least Privilege**. Below are the absolute minimum permissions and intents required for full functionality.')
            .addFields(
                { name: '📋 Required Permissions', value: permsList, inline: true },
                { name: '📡 Gateway Intents', value: intentsList, inline: true },
                { 
                    name: '🏗️ Recommended Role Hierarchy', 
                    value: '1. `Spectre` (Highest - for banning/muting staff-tier roles if needed)\n2. `Staff Roles` (Moderators/Admins)\n3. `Verified Role` (Standard users)\n4. `@everyone` (Restricted)'
                },
                {
                    name: '🔐 Recommended Server Settings',
                    value: '• **2FA for Moderators**: Enable "2FA Requirement for Moderation".\n• **Explicit Content Filter**: Set to "Scan messages from all members".\n• **Verification Level**: At least "Medium" or "High".'
                }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
