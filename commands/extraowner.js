const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    category: "Security",
    name: 'extraowner',
    description: 'Manage extra owners for this guild (Guild Owner Only)',
    highRisk: true,
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply(`${getEmoji('ERROR')} Only the server owner can manage extra owners.`);
        }

        const sub = args[0]?.toLowerCase();

        if (sub === 'add') {
            const target = message.mentions.users.first() || (args[1] ? { id: args[1] } : null);
            if (!target) return message.reply(`${getEmoji('ERROR')} Please mention a user or provide an ID.`);
            
            // Confirmation flow for high-risk action
            const confirmEmbed = new EmbedBuilder()
                .setTitle('⚠️ HIGH-RISK ACTION: Add Extra Owner')
                .setColor(0xFFA500) // Orange
                .setDescription(`You are about to add <@${target.id}> as an **Extra Owner**.\n\n**Warning:** Extra owners can use extreme security commands (Panic Mode, Anti-Nuke, Backups, etc.).\n\nTo confirm, type \`CONFIRM\` within 30 seconds.`)
                .setFooter({ text: 'This action has significant security implications.' });

            const confirmationMsg = await message.reply({ embeds: [confirmEmbed] });

            const filter = m => m.author.id === message.author.id && m.content === 'CONFIRM';
            try {
                const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
                
                if (collected.first()) {
                    db.run('INSERT INTO extra_owners (guild_id, user_id, added_by) VALUES (?, ?, ?)', [message.guild.id, target.id, message.author.id]);
                    return message.reply(`${getEmoji('SUCCESS')} User <@${target.id}> is now an extra owner.`);
                }
            } catch (e) {
                return confirmationMsg.edit({ content: '❌ Confirmation timed out or cancelled. No changes were made.', embeds: [] });
            }
        }

        if (sub === 'remove') {
            const target = message.mentions.users.first() || (args[1] ? { id: args[1] } : null);
            if (!target) return message.reply(`${getEmoji('ERROR')} Please mention a user or provide an ID.`);
            
            db.run('DELETE FROM extra_owners WHERE guild_id = ? AND user_id = ?', [message.guild.id, target.id]);
            return message.reply(`${getEmoji('SUCCESS')} User removed from extra owners.`);
        }

        if (sub === 'list') {
            const owners = db.all('SELECT user_id, added_by, added_at FROM extra_owners WHERE guild_id = ?', [message.guild.id]);
            if (!owners.length) return message.reply(`${getEmoji('INFO')} No extra owners configured.`);
            
            const list = owners.map(o => `• <@${o.user_id}> (\`${o.user_id}\`)\n  └ Added by: <@${o.added_by}> at \`${o.added_at}\``).join('\n\n');
            const embed = new EmbedBuilder()
                .setTitle('👑 Extra Owners List')
                .setColor(0x00FF00)
                .setDescription(list)
                .setFooter({ text: 'Extra owners hold significant server permissions.' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        return message.reply(`${getEmoji('INFO')} Usage: \`s!extraowner add/remove/list <@user>\``);
    }
};
