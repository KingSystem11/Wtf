const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'spectrelockdown',
    description: 'Enable ALL protections and panic mode (Owner Only)',
    ownerOnly: true,
    highRisk: true,
    async execute(message) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ This command can only be used by the server owner.');
        }

        // Update database for all protections
        db.prepare(`
            INSERT INTO guild_config (guild_id, antinuke, antiraid, antispam, antilink, aifilter, panic_mode) 
            VALUES (?, 1, 1, 1, 1, 1, 1) 
            ON CONFLICT(guild_id) DO UPDATE SET 
                antinuke = 1, 
                antiraid = 1, 
                antispam = 1, 
                antilink = 1, 
                aifilter = 1, 
                panic_mode = 1
        `).run(message.guild.id);

        try {
            // Physical lockdown
            await message.guild.roles.everyone.setPermissions(message.guild.roles.everyone.permissions.remove(PermissionFlagsBits.SendMessages));

            const embed = new EmbedBuilder()
                .setTitle('⚠️ ULTIMATE LOCKDOWN ACTIVATED ⚠️')
                .setColor('#FF0000')
                .setDescription('The server owner has enabled every security layer and panic mode.')
                .addFields(
                    { name: 'Protections Enabled', value: '• Anti-Nuke\n• Anti-Raid\n• Anti-Spam\n• Anti-Link\n• AI Filtering' },
                    { name: 'Panic Actions', value: '• Server Lockdown (Send Messages Removed)\n• Auto-Kick New Joins' }
                )
                .setFooter({ text: '👻 Total Security Active' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Spectre Lockdown failed:', err);
            message.reply('An error occurred during lockdown, but protections were enabled in the database.');
        }
    }
};