const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'debugconfig',
    description: 'Inspector for guild configuration (Global Owner Only)',
    ownerOnly: true,
    async execute(message, args, client) {
        const botOwnerId = process.env.BOT_OWNER_ID;
        if (!botOwnerId || message.author.id !== botOwnerId) {
            return message.reply('❌ This command is restricted to the global bot owner.');
        }

        const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        const premium = db.prepare('SELECT * FROM premium_guilds WHERE guild_id = ?').get(message.guild.id);
        
        if (!config) return message.reply('No configuration found for this guild.');

        const embed = new EmbedBuilder()
            .setTitle(`🛠️ Debug Config: ${message.guild.name}`)
            .setColor('#FFFF00')
            .addFields(
                { name: '📡 General', value: `Log Channel: <#${config.log_channel}>\nStaff Role: <@&${config.staff_role_id}>\nLanguage: \`${config.language}\`` },
                { name: '🛡️ Security Status', value: `Anti-Nuke: ${config.antinuke ? '✅' : '❌'} (Limit: ${config.antinuke_limit}, Window: ${config.antinuke_window}s)\nAnti-Raid: ${config.antiraid ? '✅' : '❌'} (Max Joins: ${config.max_joins})\nAnti-Spam: ${config.antispam ? '✅' : '❌'} (Max Msg: ${config.max_messages}, Int: ${config.interval}s)\nAnti-Link: ${config.antilink ? '✅' : '❌'}`, inline: false },
                { name: '🤖 AI & State', value: `AI Filter: ${config.aifilter ? '✅' : '❌'}\nPanic Mode: ${config.panic_mode ? '✅' : '❌'}`, inline: true },
                { name: '⭐ Premium', value: premium ? `Status: ✅ Active\nExpires: \`${premium.expires_at}\`` : 'Status: ❌ Inactive', inline: true }
            )
            .setFooter({ text: 'Spectre Developer Debug Console' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};