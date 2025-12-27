const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    category: "Security",
    name: 'panic',
    description: 'Toggle global server panic mode',
    highRisk: true,
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('You do not have permission.');
        
        const config = db.prepare('SELECT panic_mode, log_channel FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        const newState = !config?.panic_mode;
        
        db.prepare('INSERT INTO guild_config (guild_id, panic_mode) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET panic_mode = EXCLUDED.panic_mode').run(message.guild.id, newState ? 1 : 0);

        try {
            if (newState) {
                // Lockdown: Remove send messages from @everyone
                await message.guild.roles.everyone.setPermissions(message.guild.roles.everyone.permissions.remove(PermissionFlagsBits.SendMessages));
                message.reply('🚨 **PANIC MODE ACTIVATED** 🚨\n- Server has been locked down.\n- New joins will be automatically kicked.');
            } else {
                // Restore: Add send messages back to @everyone (basic restore)
                await message.guild.roles.everyone.setPermissions(message.guild.roles.everyone.permissions.add(PermissionFlagsBits.SendMessages));
                message.reply('✅ **Panic mode deactivated.** Server has been restored to normal operation.');
            }

            const logChannel = message.guild.channels.cache.get(config?.log_channel);
            if (logChannel) {
                logChannel.send({
                    embeds: [{
                        title: newState ? '🚨 Panic Mode ENABLED' : '✅ Panic Mode DISABLED',
                        color: newState ? 0xFF0000 : 0x00FF00,
                        description: `Panic mode has been ${newState ? 'activated' : 'deactivated'} by **${message.author.tag}**.`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (err) {
            console.error('Panic toggle failed:', err);
            message.reply('An error occurred while toggling panic mode.');
        }
    }
};