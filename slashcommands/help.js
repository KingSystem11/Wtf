const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const strings = require('../utils/strings');
const { isStaff, isOwner } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all available commands'),
    
    async execute(interaction) {
        const dbWrapper = require('../utils/db');
        const config = dbWrapper.query('SELECT staff_role_id, language FROM guild_config WHERE guild_id = ?', [interaction.guildId]);
        const lang = config?.language || 'en';
        const langStrings = strings[lang] || strings.en;
        
        const memberIsStaff = isStaff(interaction.member, config);
        const memberIsOwner = isOwner(interaction.user);

        const categories = {
            'General': [
                { name: '/ping', desc: 'Check bot latency', staff: false },
                { name: '/help', desc: 'Show this menu', staff: false },
                { name: '/securitylevel', desc: 'Check security posture', staff: true },
                { name: '/checklist', desc: 'Security checklist', staff: true }
            ],
            'Premium': [
                { name: '/beastmode', desc: 'Manage Beast Mode', staff: true, premium: true },
                { name: '/whitelist', desc: 'Manage whitelist', staff: true }
            ]
        };

        let description = '## 🛡️ Spectre Commands\n\n';
        
        for (const [category, commands] of Object.entries(categories)) {
            const visibleCommands = commands.filter(cmd => {
                if (cmd.staff && !memberIsStaff) return false;
                if (cmd.premium && !memberIsStaff) return false;
                if (cmd.owner && !memberIsOwner) return false;
                return true;
            });

            if (visibleCommands.length > 0) {
                description += `**${category}:**\n`;
                visibleCommands.forEach(cmd => {
                    description += `• \`${cmd.name}\` — ${cmd.desc}\n`;
                });
                description += '\n';
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('👻 Spectre Help')
            .setColor(0x5865F2)
            .setDescription(description)
            .setFooter({ text: 'Use /command to run slash commands or s!command for prefix commands' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
