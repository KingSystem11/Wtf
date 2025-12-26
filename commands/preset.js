const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { applyPreset, getPresetList, PRESETS } = require('../utils/presets');

module.exports = {
    name: 'preset',
    description: 'Apply security presets to your server',
    highRisk: true,
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Administrators only.');
        }

        const presetName = args[0]?.toLowerCase();

        if (!presetName) {
            // Show available presets
            const presets = getPresetList();
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Security Presets')
                .setColor(0x5865F2)
                .setDescription('Quickly configure your server protection')
                .addFields(
                    Object.entries(presets).map(([key, preset]) => ({
                        name: `\`${key}\` - ${preset.name}`,
                        value: `${preset.description}\n${preset.tags.join(' ')}`,
                        inline: false,
                    }))
                )
                .addFields({
                    name: 'Usage',
                    value: '`s!preset <soft|balanced|max>`',
                    inline: false,
                })
                .setFooter({ text: 'Premium guilds unlock all AI features' });

            return message.reply({ embeds: [embed] });
        }

        // Apply the preset
        const result = await applyPreset(message.guild, presetName);

        if (!result.success) {
            return message.reply(`❌ ${result.error}`);
        }

        // Build response embed
        const embed = new EmbedBuilder()
            .setTitle(`✅ ${result.preset.name} Preset Applied`)
            .setColor(0x00FF00)
            .setDescription(`Security preset configured for **${message.guild.name}**`)
            .addFields(
                { name: 'Preset', value: result.preset.name, inline: true },
                { name: 'Settings Changed', value: result.changes.length > 0 ? result.changes.join('\n') : 'None', inline: false }
            );

        if (result.premiumWarning) {
            embed.addFields({
                name: '⚠️ Premium Notice',
                value: result.premiumWarning,
                inline: false,
            });
        }

        embed.setFooter({ text: `Applied by ${message.author.tag}` });

        message.reply({ embeds: [embed] });
    }
};
