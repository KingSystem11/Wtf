const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'usage',
    description: 'Displays command usage statistics',
    async execute(message, args) {
        const commandName = args[0]?.toLowerCase();

        if (commandName) {
            const stats = db.prepare('SELECT uses, last_used_at FROM command_usage WHERE guild_id = ? AND command_name = ?').get(message.guild.id, commandName);
            if (!stats) return message.reply(`No usage data found for command \`${commandName}\`.`);

            const embed = new EmbedBuilder()
                .setTitle(`📊 Usage: ${commandName}`)
                .setColor('#00FF00')
                .addFields(
                    { name: 'Total Uses', value: `\`${stats.uses}\``, inline: true },
                    { name: 'Last Used', value: `\`${stats.last_used_at}\``, inline: true }
                )
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const topCommands = db.prepare('SELECT command_name, uses FROM command_usage WHERE guild_id = ? ORDER BY uses DESC LIMIT 5').all(message.guild.id);
        
        if (topCommands.length === 0) return message.reply('No command usage data recorded yet.');

        const usageList = topCommands.map((cmd, i) => `${i + 1}. \`${cmd.command_name}\`: **${cmd.uses}** uses`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('📊 Top Commands')
            .setColor('#00FF00')
            .setDescription(usageList)
            .setFooter({ text: '👻 Spectre Analytics' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};