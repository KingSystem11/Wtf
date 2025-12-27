const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'restore',
    description: 'Restore server configuration from a backup (Owner Only)',
    ownerOnly: true,
    highRisk: true,
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ Only the server owner can restore backups.');
        }

        const backupId = parseInt(args[0]);
        if (isNaN(backupId)) return message.reply('Usage: `s!restore <backupId>`');

        const backup = db.prepare('SELECT * FROM backups WHERE id = ? AND guild_id = ?').get(backupId, message.guild.id);
        if (!backup) return message.reply('Backup not found for this server.');

        try {
            const data = JSON.parse(backup.data_json);
            
            // Restore guild_config
            const c = data.config;
            db.prepare(`
                INSERT INTO guild_config (
                    guild_id, prefix, log_channel, antinuke, aifilter, antispam, 
                    max_messages, interval, antilink, antiraid, max_joins, 
                    antinuke_limit, antinuke_window, panic_mode, staff_role_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(guild_id) DO UPDATE SET
                    prefix = EXCLUDED.prefix,
                    log_channel = EXCLUDED.log_channel,
                    antinuke = EXCLUDED.antinuke,
                    aifilter = EXCLUDED.aifilter,
                    antispam = EXCLUDED.antispam,
                    max_messages = EXCLUDED.max_messages,
                    interval = EXCLUDED.interval,
                    antilink = EXCLUDED.antilink,
                    antiraid = EXCLUDED.antiraid,
                    max_joins = EXCLUDED.max_joins,
                    antinuke_limit = EXCLUDED.antinuke_limit,
                    antinuke_window = EXCLUDED.antinuke_window,
                    panic_mode = EXCLUDED.panic_mode,
                    staff_role_id = EXCLUDED.staff_role_id
            `).run(
                c.guild_id, c.prefix, c.log_channel, c.antinuke, c.aifilter, c.antispam,
                c.max_messages, c.interval, c.antilink, c.antiraid, c.max_joins,
                c.antinuke_limit, c.antinuke_window, c.panic_mode, c.staff_role_id
            );

            // Restore whitelist
            db.prepare('DELETE FROM whitelist WHERE guild_id = ?').run(message.guild.id);
            if (data.whitelist && data.whitelist.length > 0) {
                const insertWhitelist = db.prepare('INSERT INTO whitelist (guild_id, domain) VALUES (?, ?)');
                for (const row of data.whitelist) {
                    insertWhitelist.run(message.guild.id, row.domain);
                }
            }

            // Restore premium if it was active in backup
            if (data.premium) {
                db.prepare(`
                    INSERT INTO premium_guilds (guild_id, activated_by, expires_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(guild_id) DO UPDATE SET
                        activated_by = EXCLUDED.activated_by,
                        expires_at = EXCLUDED.expires_at
                `).run(data.premium.guild_id, data.premium.activated_by, data.premium.expires_at);
            }

            const embed = new EmbedBuilder()
                .setTitle('♻️ Configuration Restored')
                .setColor('#00FF00')
                .setDescription(`Successfully restored configuration from Backup ID: \`${backupId}\``)
                .addFields(
                    { name: 'Restored Items', value: '• Log Channel\n• Anti-Nuke/Raid/Spam/Link Settings\n• Staff Role\n• Whitelisted Domains\n• Premium Status' }
                )
                .setFooter({ text: '👻 Spectre Security' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Restore failed:', err);
            message.reply('An error occurred while restoring the backup.');
        }
    }
};