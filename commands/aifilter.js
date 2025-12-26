const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'aifilter',
    description: 'Toggle AI message filtering',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('You do not have permission.');
        
        // Premium Check
        const premium = db.prepare('SELECT expires_at FROM premium_guilds WHERE guild_id = ?').get(message.guild.id);
        const isPremium = premium && (new Date(premium.expires_at) > new Date());
        if (!isPremium) return message.reply('💎 This feature requires **Spectre Premium**. Use `s!premium status` to learn more.');

        const state = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(state)) return message.reply('Usage: s!aifilter <on/off>');

        const value = state === 'on' ? 1 : 0;
        db.prepare('INSERT INTO guild_config (guild_id, aifilter) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET aifilter = EXCLUDED.aifilter').run(message.guild.id, value);
        
        message.reply(`🤖 AI filtering has been turned **${state.toUpperCase()}**.`);
    }
};