const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'backup',
    description: 'Create a backup of server configuration (Owner Only)',
    ownerOnly: true,
    highRisk: true,
    async execute(message) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ Only the server owner can create backups.');
        }

        const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        if (!config) return message.reply('No configuration found to backup.');

        const whitelist = db.prepare('SELECT domain FROM whitelist WHERE guild_id = ?').all(message.guild.id);
        const premium = db.prepare('SELECT * FROM premium_guilds WHERE guild_id = ?').get(message.guild.id);

        const backupData = {
            config,
            whitelist,
            premium
        };

        const result = db.prepare('INSERT INTO backups (guild_id, data_json) VALUES (?, ?)').run(
            message.guild.id,
            JSON.stringify(backupData)
        );

        const embed = new EmbedBuilder()
            .setTitle('📦 Backup Created')
            .setColor('#00FF00')
            .setDescription(`Server configuration has been backed up successfully.\n**Backup ID:** \`${result.lastInsertRowid}\``)
            .setFooter({ text: '👻 Spectre Security' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};