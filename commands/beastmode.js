const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    category: "Security",
    name: 'beastmode',
    description: 'Manage Beast Mode protection (Premium Only)',
    async execute(message, args) {
        const premium = db.query('SELECT expires_at FROM premium_guilds WHERE guild_id = ?', [message.guild.id]);
        const isPremium = premium && (new Date(premium.expires_at) > new Date());
        
        if (!isPremium) {
            return message.reply(`${getEmoji('ERROR')} Beast Mode is a **PREMIUM ONLY** feature. Use \`s!premium\` to learn more.`);
        }

        const sub = args[0]?.toLowerCase();
        const config = db.query('SELECT beast_enabled, beast_limit_ban, beast_limit_kick, beast_limit_everyone FROM guild_config WHERE guild_id = ?', [message.guild.id]);

        if (!sub) {
            const status = config.beast_enabled ? '✅ **ENABLED**' : '❌ **DISABLED**';
            const embed = new EmbedBuilder()
                .setTitle('🦁 Beast Mode Status')
                .setColor(config.beast_enabled ? 0x00FF00 : 0xFF0000)
                .setDescription(`Beast Mode protects against betrayal from trusted staff and bots.\n\nStatus: ${status}`)
                .addFields(
                    { name: 'Ban Limit', value: `${config.beast_limit_ban} per 10m`, inline: true },
                    { name: 'Kick Limit', value: `${config.beast_limit_kick} per 10m`, inline: true },
                    { name: 'Everyone Limit', value: `${config.beast_limit_everyone} per 10m`, inline: true }
                )
                .setFooter({ text: 'Use s!beastmode enable/disable/config' });
            return message.reply({ embeds: [embed] });
        }

        if (sub === 'enable') {
            db.run('UPDATE guild_config SET beast_enabled = 1 WHERE guild_id = ?', [message.guild.id]);
            return message.reply(`${getEmoji('SUCCESS')} Beast Mode has been **ENABLED**.`);
        }

        if (sub === 'disable') {
            db.run('UPDATE guild_config SET beast_enabled = 0 WHERE guild_id = ?', [message.guild.id]);
            return message.reply(`${getEmoji('SUCCESS')} Beast Mode has been **DISABLED**.`);
        }

        if (sub === 'config') {
            const action = args[1]?.toLowerCase();
            const limit = parseInt(args[2]);
            
            if (!['ban', 'kick', 'everyone'].includes(action) || isNaN(limit) || limit < 1) {
                return message.reply(`${getEmoji('ERROR')} Usage: \`s!beastmode config <ban|kick|everyone> <number>\``);
            }

            db.run(`UPDATE guild_config SET beast_limit_${action} = ? WHERE guild_id = ?`, [limit, message.guild.id]);
            return message.reply(`${getEmoji('SUCCESS')} Beast Mode **${action}** limit updated to **${limit}**.`);
        }
    }
};
