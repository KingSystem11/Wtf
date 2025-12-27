const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');
const dbWrapper = require('../utils/db');
const { isStaff, isOwner, canUseCommand } = require('../utils/permissions');
const { getEmoji } = require('../utils/emojis');
const config = require('../configLoader');

module.exports = {
    name: 'help',
    description: 'Displays the Spectre help menu',
    aliases: ['h'],
    category: 'Utility',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays the Spectre help menu')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category to view')
                .addChoices(
                    { name: 'Moderation', value: 'moderation' },
                    { name: 'Security', value: 'security' },
                    { name: 'AI / Premium', value: 'ai' },
                    { name: 'Utility', value: 'utility' }
                )),

    async execute(messageOrInteraction, args, client) {
        const isSlash = !!messageOrInteraction.isChatInputCommand;
        const guildId = messageOrInteraction.guildId || messageOrInteraction.guild.id;
        const member = messageOrInteraction.member;
        
        const guildConfig = dbWrapper.query('SELECT staff_role_id, language FROM guild_config WHERE guild_id = ?', [guildId]);
        const prefix = config.prefix;

        const categoryInput = isSlash ? messageOrInteraction.options.getString('category') : args[0]?.toLowerCase();

        // Manual mapping for commands without explicit category field
        const getCategoryCommands = (categoryName) => {
            return client.commands.filter(cmd => {
                if (cmd.category && cmd.category.toLowerCase() === categoryName) return true;
                
                const modCmds = ['ban', 'kick', 'mute', 'unmute', 'warn', 'case', 'why'];
                const secCmds = ['antinuke', 'antiraid', 'antilink', 'antispam', 'panic', 'spectrelockdown', 'lock', 'unlock', 'serverlock', 'slowmode', 'setlog', 'setstaffrole', 'loglevel', 'perms', 'exportlogs', 'webhookscan', 'usage', 'cleanup', 'securitylevel', 'setupsecurity', 'verifyme', 'setverifiedrole', 'pipeline', 'spectreconfig', 'setlang', 'reload', 'shutdown', 'debugconfig', 'devstatus', 'sim', 'genlicense', 'resetsecurity', 'resetall', 'preset', 'chanset', 'globalban', 'incident', 'jsonstatus', 'verify', 'verifysetup'];
                const aiCmds = ['activatelicense', 'aifilter', 'aimode', 'ailogs', 'premium', 'backup', 'restore'];
                const utilCmds = ['ping', 'help', 'info', 'privacy', 'debugping', 'describe', 'checklist', 'securitydocs', 'start'];

                if (categoryName === 'moderation' && modCmds.includes(cmd.name)) return true;
                if (categoryName === 'security' && secCmds.includes(cmd.name)) return true;
                if (categoryName === 'ai' && aiCmds.includes(cmd.name)) return true;
                if (categoryName === 'utility' && utilCmds.includes(cmd.name)) return true;
                if (categoryName === 'owner' && (cmd.ownerOnly || cmd.devOnly)) return true;
                return false;
            });
        };

        const createMainEmbed = () => {
            const embed = new EmbedBuilder()
                .setTitle(`${getEmoji('INFO')} Spectre Help`)
                .setDescription(`Welcome to **Spectre**, the ultimate security bot for your server.\n\n` +
                    `Current Prefix: \`${prefix}\`\n` +
                    `Use \`${prefix}describe <command>\` for detailed command info.`)
                .setColor('#00FFAA')
                .addFields(
                    { name: `${getEmoji('MOD')} Moderation`, value: Array.from(getCategoryCommands('moderation').keys()).map(n => `\`${n}\``).join(', ') || 'No commands', inline: false },
                    { name: `${getEmoji('SECURITY')} Security`, value: Array.from(getCategoryCommands('security').keys()).map(n => `\`${n}\``).join(', ') || 'No commands', inline: false },
                    { name: `${getEmoji('AI')} AI / Premium`, value: Array.from(getCategoryCommands('ai').keys()).map(n => `\`${n}\``).join(', ') || 'No commands', inline: false },
                    { name: `${getEmoji('SETTINGS')} Utility`, value: Array.from(getCategoryCommands('utility').keys()).map(n => `\`${n}\``).join(', ') || 'No commands', inline: false }
                )
                .setFooter({ text: `Developed for Performance & Security | Total Commands: ${client.commands.size}` })
                .setTimestamp();

            if (isOwner(member)) {
                embed.addFields({ name: `${getEmoji('OWNER')} Owner / Dev`, value: Array.from(getCategoryCommands('owner').keys()).map(n => `\`${n}\``).join(', ') || 'No commands', inline: false });
            }
            return embed;
        };

        const createCategoryEmbed = (category) => {
            const displayNames = {
                moderation: { name: 'Moderation', emoji: 'MOD' },
                security: { name: 'Security', emoji: 'SECURITY' },
                ai: { name: 'AI / Premium', emoji: 'AI' },
                utility: { name: 'Utility', emoji: 'SETTINGS' },
                owner: { name: 'Owner / Dev', emoji: 'OWNER' }
            };

            const catInfo = displayNames[category] || { name: 'Commands', emoji: 'INFO' };
            const cmds = getCategoryCommands(category);
            const visibleCmds = Array.from(cmds.values()).filter(cmd => canUseCommand(member, cmd, guildConfig));

            return new EmbedBuilder()
                .setTitle(`${getEmoji(catInfo.emoji)} ${catInfo.name} Commands`)
                .setColor('#00FFAA')
                .setDescription(visibleCmds.map(cmd => `**${cmd.name}** – ${cmd.description || 'No description'}`).join('\n') || 'No commands available for you in this category.')
                .setFooter({ text: `Use ${prefix}describe <command> for detailed info.` })
                .setTimestamp();
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('help_mod').setLabel('Moderation').setEmoji(getEmoji('MOD')).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('help_sec').setLabel('Security').setEmoji(getEmoji('SECURITY')).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('help_ai').setLabel('AI / Premium').setEmoji(getEmoji('AI')).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('help_util').setLabel('Utility').setEmoji(getEmoji('SETTINGS')).setStyle(ButtonStyle.Secondary)
            );

        if (categoryInput && ['moderation', 'security', 'ai', 'utility', 'owner'].includes(categoryInput)) {
            const embed = createCategoryEmbed(categoryInput);
            if (isSlash) return await messageOrInteraction.reply({ embeds: [embed] });
            return await messageOrInteraction.reply({ embeds: [embed] });
        }

        const initialEmbed = createMainEmbed();
        const response = isSlash 
            ? await messageOrInteraction.reply({ embeds: [initialEmbed], components: [row], fetchReply: true })
            : await messageOrInteraction.reply({ embeds: [initialEmbed], components: [row] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== (isSlash ? messageOrInteraction.user.id : messageOrInteraction.author.id)) {
                return i.reply({ content: "This menu is not for you.", ephemeral: true });
            }

            let category = '';
            if (i.customId === 'help_mod') category = 'moderation';
            if (i.customId === 'help_sec') category = 'security';
            if (i.customId === 'help_ai') category = 'ai';
            if (i.customId === 'help_util') category = 'utility';

            const newEmbed = createCategoryEmbed(category);
            await i.update({ embeds: [newEmbed] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                row.components.map(button => ButtonBuilder.from(button).setDisabled(true))
            );
            if (isSlash) messageOrInteraction.editReply({ components: [disabledRow] }).catch(() => {});
            else response.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};
