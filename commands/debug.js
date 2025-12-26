const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'debug',
    description: 'Toggle per-guild debug mode (Server Owner Only)',
    premiumOnly: true,
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ This command can only be used by the server owner.');
        }

        const input = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(input)) {
            const config = db.prepare('SELECT debug FROM guild_config WHERE guild_id = ?').get(message.guild.id);
            return message.reply(`Current debug mode: **${config?.debug ? 'ON' : 'OFF'}**. Use \`s!debug on/off\` to change.`);
        }

        const debugVal = input === 'on' ? 1 : 0;
        db.prepare('UPDATE guild_config SET debug = ? WHERE guild_id = ?').run(debugVal, message.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('🛠️ Debug Mode Updated')
            .setColor(debugVal ? '#FFA500' : '#00FF00')
            .setDescription(`Debug mode for this server has been turned **${input.toUpperCase()}**.`)
            .addFields(
                { name: 'Detailed Logging', value: debugVal ? '✅ Enabled' : '❌ Disabled' },
                { name: 'Tracing', value: debugVal ? '✅ Enabled' : '❌ Disabled' }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
