const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'antilink',
    description: 'Configure link and invite protection',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('You do not have permission.');
        
        const sub = args[0]?.toLowerCase();
        if (sub === 'on' || sub === 'off') {
            const value = sub === 'on' ? 1 : 0;
            db.prepare('INSERT INTO guild_config (guild_id, antilink) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET antilink = EXCLUDED.antilink').run(message.guild.id, value);
            return message.reply(`🔗 Anti-link has been turned **${sub.toUpperCase()}**.`);
        }

        if (sub === 'whitelist') {
            const action = args[1]?.toLowerCase();
            const domain = args[2]?.toLowerCase().replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];

            if (action === 'add' && domain) {
                db.prepare('INSERT OR IGNORE INTO whitelist (guild_id, domain) VALUES (?, ?)').run(message.guild.id, domain);
                return message.reply(`✅ Added **${domain}** to the whitelist.`);
            }
            if (action === 'remove' && domain) {
                db.prepare('DELETE FROM whitelist WHERE guild_id = ? AND domain = ?').run(message.guild.id, domain);
                return message.reply(`❌ Removed **${domain}** from the whitelist.`);
            }
            return message.reply('Usage: `s!antilink whitelist add/remove <domain>`');
        }

        message.reply('Usage:\n`s!antilink <on/off>`\n`s!antilink whitelist add <domain>`\n`s!antilink whitelist remove <domain>`');
    }
};