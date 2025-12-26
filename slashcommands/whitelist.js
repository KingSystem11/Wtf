const { EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../utils/db');
const { getEmoji } = require('../utils/emojis');

// Track active whitelist sessions per guild and user to prevent overlapping
const activeWhitelistSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manage whitelist entries')
        .addUserOption(opt =>
            opt
                .setName('user')
                .setDescription('User to whitelist')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            const extraOwners = db.all('SELECT user_id FROM extra_owners WHERE guild_id = ?', [interaction.guildId]);
            if (!extraOwners.some(o => o.user_id === interaction.user.id)) {
                return interaction.reply({ content: `${getEmoji('ERROR')} Only the server owner or extra owners can manage the whitelist.`, ephemeral: true });
            }
        }

        const target = interaction.options.getUser('user');
        
        // Check for existing active session
        const sessionKey = `${interaction.guildId}-${interaction.user.id}`;
        if (activeWhitelistSessions.has(sessionKey)) {
            return interaction.reply({ content: `${getEmoji('WARN')} You already have an active whitelist session. Please complete or cancel it first.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Whitelist Management')
            .setDescription(`Configure whitelist modules for **${target.tag}**.\n\nSelect the modules this user should be exempt from using the dropdown below.`)
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

        await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });

        // Register active session
        activeWhitelistSessions.set(sessionKey, true);

        const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });
        let selectedModules = [];

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: `${getEmoji('ERROR')} Only <@${interaction.user.id}> can interact with this menu.`, ephemeral: true });
            }

            if (i.customId === 'whitelist_modules') {
                selectedModules = i.values.filter(v => v !== 'beast');
                await i.deferUpdate();
            } else if (i.customId === 'whitelist_save') {
                if (selectedModules.length === 0) return i.reply({ content: 'Select at least one valid module.', ephemeral: true });
                
                db.run('INSERT OR REPLACE INTO whitelist (guild_id, target_id, type, scopes, added_by) VALUES (?, ?, ?, ?, ?)', 
                    [interaction.guildId, target.id, 'user', selectedModules.join(','), interaction.user.id]);
                
                const successEmbed = new EmbedBuilder()
                    .setTitle(`${getEmoji('SUCCESS')} Whitelist Updated`)
                    .setDescription(`Successfully updated whitelist for **${target.tag}**.`)
                    .addFields({ name: 'Enabled Modules', value: selectedModules.join(', ') })
                    .setColor(0x00FF00);
                
                await i.update({ embeds: [successEmbed], components: [] });
                collector.stop();
            } else if (i.customId === 'whitelist_cancel') {
                await i.update({ content: 'Whitelist setup cancelled.', embeds: [], components: [] });
                collector.stop();
            }
        });

        collector.on('end', async () => {
            // Remove active session
            activeWhitelistSessions.delete(sessionKey);
        });
    }
};
