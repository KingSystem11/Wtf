const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../utils/db');
const { getEmoji } = require('../utils/emojis');

// Track active whitelist sessions per guild and user to prevent overlapping
const activeWhitelistSessions = new Map();

module.exports = {
    category: "Security",
    name: 'whitelist',
    description: 'Manage whitelist entries using an interactive menu.',
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId) {
            const extraOwners = db.all('SELECT user_id FROM extra_owners WHERE guild_id = ?', [message.guild.id]);
            if (!extraOwners.some(o => o.user_id === message.author.id)) {
                return message.reply(`${getEmoji('ERROR')} Only the server owner or extra owners can manage the whitelist.`);
            }
        }

        // Check for existing active session
        const sessionKey = `${message.guild.id}-${message.author.id}`;
        if (activeWhitelistSessions.has(sessionKey)) {
            return message.reply(`${getEmoji('WARN')} You already have an active whitelist session. Please complete or cancel it first.`);
        }

        const target = message.mentions.users.first() || (args[0] ? { id: args[0], tag: args[0] } : null);
        if (!target) return message.reply(`${getEmoji('ERROR')} Please mention a user or provide an ID.`);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Whitelist Management')
            .setDescription(`Configure whitelist modules for **${target.tag || target.id}**.\n\nSelect the modules this user should be exempt from using the dropdown below.`)
            .setColor(0x5865F2)
            .addFields(
                { name: 'Note', value: 'Beast Mode cannot be whitelisted to ensure protection against betrayal.' }
            );

        const select = new StringSelectMenuBuilder()
            .setCustomId('whitelist_modules')
            .setPlaceholder('Select modules...')
            .setMinValues(1)
            .setMaxValues(5)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Anti-Link').setValue('antilink').setDescription('Bypass link/invite filters'),
                new StringSelectMenuOptionBuilder().setLabel('Anti-Spam').setValue('antispam').setDescription('Bypass message frequency limits'),
                new StringSelectMenuOptionBuilder().setLabel('Anti-Mention-Everyone').setValue('anti-mention-everyone').setDescription('Bypass @everyone/@here restrictions'),
                new StringSelectMenuOptionBuilder().setLabel('Anti-Raid').setValue('antiraid').setDescription('Bypass join frequency limits'),
                new StringSelectMenuOptionBuilder().setLabel('Anti-Nuke').setValue('antinuke').setDescription('Bypass administrative action limits'),
                new StringSelectMenuOptionBuilder().setLabel('Beast Mode (Protected)').setValue('beast').setDescription('Cannot be whitelisted').setDefault(false)
            );

        const saveBtn = new ButtonBuilder().setCustomId('whitelist_save').setLabel('Save').setStyle(ButtonStyle.Success);
        const cancelBtn = new ButtonBuilder().setCustomId('whitelist_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger);

        const row1 = new ActionRowBuilder().addComponents(select);
        const row2 = new ActionRowBuilder().addComponents(saveBtn, cancelBtn);

        const response = await message.reply({ embeds: [embed], components: [row1, row2] });

        // Register active session
        activeWhitelistSessions.set(sessionKey, true);

        const collector = response.createMessageComponentCollector({ time: 60000 });
        let selectedModules = [];

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) {
                return i.reply({ content: `${getEmoji('ERROR')} Only <@${message.author.id}> can interact with this menu.`, ephemeral: true });
            }

            if (i.customId === 'whitelist_modules') {
                selectedModules = i.values.filter(v => v !== 'beast');
                await i.deferUpdate();
            } else if (i.customId === 'whitelist_save') {
                if (selectedModules.length === 0) return i.reply({ content: 'Select at least one valid module.', ephemeral: true });
                
                db.run('INSERT OR REPLACE INTO whitelist (guild_id, target_id, type, scopes, added_by) VALUES (?, ?, ?, ?, ?)', 
                    [message.guild.id, target.id, 'user', selectedModules.join(','), message.author.id]);
                
                const { getLocalizedString } = require('../utils/localization');
                const title = getLocalizedString(message.guild.id, 'whitelist_updated', { user: target.tag || target.id });
                const modulesLabel = getLocalizedString(message.guild.id, 'whitelist_modules');
                const successEmbed = new EmbedBuilder()
                    .setTitle(`${getEmoji('SUCCESS')} ${title}`)
                    .setDescription('')
                    .addFields({ name: modulesLabel, value: selectedModules.join(', ') })
                    .setColor(0x00FF00);
                
                await i.update({ embeds: [successEmbed], components: [] });
                collector.stop();
            } else if (i.customId === 'whitelist_cancel') {
                const { getLocalizedString } = require('../utils/localization');
                const cancelText = getLocalizedString(message.guild.id, 'whitelist_cancelled');
                await i.update({ content: cancelText, embeds: [], components: [] });
                collector.stop();
            }
        });

        collector.on('end', async () => {
            // Remove active session
            activeWhitelistSessions.delete(sessionKey);

            try {
                // Disable all components and show expiration message
                const disabledSelect = new StringSelectMenuBuilder()
                    .setCustomId('whitelist_modules_expired')
                    .setPlaceholder('Session expired')
                    .setDisabled(true)
                    .addOptions(
                        new StringSelectMenuOptionBuilder().setLabel('Expired').setValue('expired').setDescription('This session has expired')
                    );

                const disabledSaveBtn = new ButtonBuilder()
                    .setCustomId('whitelist_save_expired')
                    .setLabel('Save')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true);

                const disabledCancelBtn = new ButtonBuilder()
                    .setCustomId('whitelist_cancel_expired')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true);

                const expiredRow1 = new ActionRowBuilder().addComponents(disabledSelect);
                const expiredRow2 = new ActionRowBuilder().addComponents(disabledSaveBtn, disabledCancelBtn);

                const expiredEmbed = new EmbedBuilder()
                    .setTitle('⏱️ Whitelist Session Expired')
                    .setDescription(`The whitelist configuration session for **${target.tag || target.id}** has expired after 60 seconds of inactivity.`)
                    .setColor(0xFF6B6B);

                await response.edit({ embeds: [expiredEmbed], components: [expiredRow1, expiredRow2] });
            } catch (error) {
                console.error('Error handling whitelist session expiration:', error);
            }
        });
    }
};
