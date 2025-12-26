const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const { getEmoji } = require('../helpers/emoji');

module.exports = {
    name: 'premium',
    description: 'Manage or view premium status',
    async execute(message, args) {
        const sub = args[0]?.toLowerCase();

        if (sub === 'on') {
            if (message.author.id !== message.guild.ownerId) {
                return message.reply(`${getEmoji('ERROR')} Only the server owner can activate premium.`);
            }

            const days = parseInt(args[1]) || 365;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + days);

            db.prepare(`
                INSERT INTO premium_guilds (guild_id, activated_by, expires_at)
                VALUES (?, ?, ?)
                ON CONFLICT(guild_id) DO UPDATE SET
                    activated_by = EXCLUDED.activated_by,
                    expires_at = EXCLUDED.expires_at
            `).run(message.guild.id, message.author.id, expiresAt.toISOString());

            return message.reply(`${getEmoji('PREMIUM')} **Premium Activated!** Your server now has access to all premium features for **${days} days**.`);
        }

        if (sub === 'status' || !sub) {
            const premium = db.prepare('SELECT * FROM premium_guilds WHERE guild_id = ?').get(message.guild.id);
            const isPremium = premium && (new Date(premium.expires_at) > new Date());

            const embed = new EmbedBuilder()
                .setTitle(`${getEmoji('PREMIUM')} Spectre Premium Status`)
                .setColor(isPremium ? '#FFD700' : '#808080')
                .setDescription(isPremium ? 'Your server is currently **Spectre Premium**.' : 'Your server is currently on the **Free Tier**.')
                .addFields(
                    { name: 'Status', value: isPremium ? `${getEmoji('SUCCESS')} Active` : `${getEmoji('ERROR')} Inactive`, inline: true }
                );

            if (isPremium) {
                embed.addFields({ name: 'Expires At', value: `\`${new Date(premium.expires_at).toLocaleDateString()}\``, inline: true });
            }

            return message.reply({ embeds: [embed] });
        }

        message.reply('Usage:\n`s!premium status`\n`s!premium on [days]` (Owner Only)');
    }
};