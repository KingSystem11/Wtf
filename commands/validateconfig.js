const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'validateconfig',
    description: 'Validates and repairs the server configuration',
    aliases: ['vcfg'],
    async execute(message, args) {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('Only the server owner can run this command.');
        }

        const results = await validateGuildConfig(message.guild);
        
        const embed = new EmbedBuilder()
            .setTitle('🛠️ Configuration Validation')
            .setColor(results.repaired ? 0xFFAA00 : 0x00FF00)
            .setDescription(results.summary)
            .setTimestamp();

        if (results.details.length > 0) {
            embed.addFields({ name: 'Details', value: results.details.join('\n').slice(0, 1024) });
        }

        return message.reply({ embeds: [embed] });
    },
    validateGuildConfig
};

async function validateGuildConfig(guild) {
    const config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guild.id);
    if (!config) return { summary: 'No configuration found for this server.', details: [], repaired: false };

    const details = [];
    let repaired = false;
    const updates = {};

    // Check Roles
    const roles = [
        { key: 'staff_role_id', name: 'Staff Role' },
        { key: 'verified_role_id', name: 'Verified Role' }
    ];

    for (const roleInfo of roles) {
        const roleId = config[roleInfo.key];
        if (roleId && !guild.roles.cache.has(roleId)) {
            details.push(`⚠️ ${roleInfo.name} missing (ID: ${roleId}). Cleared.`);
            updates[roleInfo.key] = null;
            repaired = true;
        }
    }

    // Check Channels
    const channels = [
        { key: 'log_channel', name: 'Log Channel' },
        { key: 'verification_channel', name: 'Verification Channel' }
    ];

    for (const chanInfo of channels) {
        const chanId = config[chanInfo.key];
        if (chanId && !guild.channels.cache.has(chanId)) {
            details.push(`⚠️ ${chanInfo.name} missing (ID: ${chanId}). Cleared.`);
            updates[chanInfo.key] = null;
            repaired = true;
        }
    }

    // Check Numerical values
    const thresholds = [
        { key: 'max_messages', name: 'Max Messages', default: 8, min: 1 },
        { key: 'interval', name: 'Spam Interval', default: 5, min: 1 },
        { key: 'max_joins', name: 'Max Joins', default: 10, min: 1 },
        { key: 'antinuke_limit', name: 'Anti-Nuke Limit', default: 3, min: 1 },
        { key: 'antinuke_window', name: 'Anti-Nuke Window', default: 30, min: 5 }
    ];

    for (const threshold of thresholds) {
        const val = config[threshold.key];
        if (val === null || val < threshold.min) {
            details.push(`⚙️ ${threshold.name} invalid (${val}). Reset to ${threshold.default}.`);
            updates[threshold.key] = threshold.default;
            repaired = true;
        }
    }

    if (repaired) {
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(guild.id);
        db.prepare(`UPDATE guild_config SET ${setClause} WHERE guild_id = ?`).run(...values);
    }

    return {
        repaired,
        summary: repaired ? '✅ Configuration repaired.' : '✅ Configuration is valid.',
        details
    };
}
