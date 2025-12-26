const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const db = require('../utils/db');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beastmode')
        .setDescription('Manage Beast Mode protection (Premium Only)')
        .addSubcommand(sub =>
            sub
                .setName('status')
                .setDescription('View Beast Mode status')
        )
        .addSubcommand(sub =>
            sub
                .setName('enable')
                .setDescription('Enable Beast Mode')
        )
        .addSubcommand(sub =>
            sub
                .setName('disable')
                .setDescription('Disable Beast Mode')
        )
        .addSubcommand(sub =>
            sub
                .setName('config')
                .setDescription('Configure Beast Mode limits')
                .addStringOption(opt =>
                    opt
                        .setName('action')
                        .setDescription('What to configure')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Ban limit', value: 'ban' },
                            { name: 'Kick limit', value: 'kick' },
                            { name: '@everyone limit', value: 'everyone' }
                        )
                )
                .addIntegerOption(opt =>
                    opt
                        .setName('limit')
                        .setDescription('New limit (per 10 minutes)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10)
                )
        ),
    
    async execute(interaction) {
        const premium = db.query('SELECT expires_at FROM premium_guilds WHERE guild_id = ?', [interaction.guildId]);
        const isPremium = premium && (new Date(premium.expires_at) > new Date());
        
        if (!isPremium) {
            return interaction.reply({ content: `${getEmoji('ERROR')} Beast Mode is a **PREMIUM ONLY** feature. Use \`/premium\` to learn more.`, ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const config = db.query('SELECT beast_enabled, beast_limit_ban, beast_limit_kick, beast_limit_everyone FROM guild_config WHERE guild_id = ?', [interaction.guildId]);

        if (subcommand === 'status') {
            const status = config.beast_enabled ? '✅ **ENABLED**' : '❌ **DISABLED**';
            const embed = new EmbedBuilder()
                .setTitle('🦁 Beast Mode Status')
                .setColor(config.beast_enabled ? 0x00FF00 : 0xFF0000)
                .setDescription(`Beast Mode protects against betrayal from trusted staff and bots.\n\nStatus: ${status}`)
                .addFields(
                    { name: 'Ban Limit', value: `${config.beast_limit_ban} per 10m`, inline: true },
                    { name: 'Kick Limit', value: `${config.beast_limit_kick} per 10m`, inline: true },
                    { name: '@everyone Limit', value: `${config.beast_limit_everyone} per 10m`, inline: true }
                )
                .setFooter({ text: 'Use /beastmode enable/disable/config' });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'enable') {
            db.run('UPDATE guild_config SET beast_enabled = 1 WHERE guild_id = ?', [interaction.guildId]);
            return interaction.reply({ content: `${getEmoji('SUCCESS')} Beast Mode has been **ENABLED**.`, ephemeral: true });
        }

        if (subcommand === 'disable') {
            db.run('UPDATE guild_config SET beast_enabled = 0 WHERE guild_id = ?', [interaction.guildId]);
            return interaction.reply({ content: `${getEmoji('SUCCESS')} Beast Mode has been **DISABLED**.`, ephemeral: true });
        }

        if (subcommand === 'config') {
            const action = interaction.options.getString('action');
            const limit = interaction.options.getInteger('limit');

            db.run(`UPDATE guild_config SET beast_limit_${action} = ? WHERE guild_id = ?`, [limit, interaction.guildId]);
            return interaction.reply({ content: `${getEmoji('SUCCESS')} Beast Mode **${action}** limit updated to **${limit}**.`, ephemeral: true });
        }
    }
};
