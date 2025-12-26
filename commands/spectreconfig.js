const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'spectreconfig',
    description: 'Show current security status (Owner Only)',
    ownerOnly: true,
    async execute(message) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ This command can only be used by the server owner.');
        }

        const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        
        const status = (val) => val ? '✅ **ON**' : '❌ **OFF**';
        
        const extraOwnersCount = db.prepare('SELECT COUNT(*) as count FROM extra_owners WHERE guild_id = ?').get(message.guild.id)?.count || 0;
        const whitelistCount = db.prepare('SELECT COUNT(*) as count FROM whitelist WHERE guild_id = ?').get(message.guild.id)?.count || 0;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Spectre Security Configuration')
            .setColor('#00FF00')
            .addFields(
                { name: 'Prefix', value: `\`${process.env.PREFIX || 's!'}\``, inline: true },
                { name: 'Log Channel', value: config?.log_channel ? `<#${config.log_channel}>` : '`Not Set`', inline: true },
                { name: 'Access Controls', value: `Extra Owners: \`${extraOwnersCount}\`\nWhitelist: \`${whitelistCount}\``, inline: true },
                { name: 'Anti-Nuke', value: status(config?.antinuke), inline: true },
                { name: 'Anti-Raid', value: status(config?.antiraid), inline: true },
                { name: 'Anti-Spam', value: status(config?.antispam), inline: true },
                { name: 'Anti-Link', value: status(config?.antilink), inline: true },
                { name: 'AI Filter', value: status(config?.aifilter), inline: true },
                { name: 'Panic Mode', value: status(config?.panic_mode), inline: true }
            )
            .setFooter({ text: '👻 Owner-Only Access' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};