const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

async function runCleanup(client, manual = false) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString();

    let prunedAI = 0;
    let prunedAntiNuke = 0;

    try {
        const aiRes = db.prepare('DELETE FROM ai_logs WHERE created_at < ?').run(dateStr);
        prunedAI = aiRes.changes;

        const anRes = db.prepare('DELETE FROM antinuke_cases WHERE created_at < ?').run(dateStr);
        prunedAntiNuke = anRes.changes;

        console.log(`[Cleanup] Pruned ${prunedAI} AI logs and ${prunedAntiNuke} Anti-Nuke cases older than 30 days.`);

        if (manual) {
            return { prunedAI, prunedAntiNuke };
        }
    } catch (err) {
        console.error('[Cleanup Error]', err);
        if (manual) throw err;
    }
}

module.exports = {
    name: 'cleanup',
    description: 'Manually trigger a database and memory cleanup',
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ You do not have permission to run cleanup.');
        }

        const msg = await message.reply('🧹 Running cleanup job...');
        
        try {
            const results = await runCleanup(client, true);
            
            const embed = new EmbedBuilder()
                .setTitle('🧹 Cleanup Complete')
                .setColor('#00FF00')
                .addFields(
                    { name: 'AI Logs Pruned', value: `\`${results.prunedAI}\``, inline: true },
                    { name: 'Anti-Nuke Cases Pruned', value: `\`${results.prunedAntiNuke}\``, inline: true },
                    { name: 'Memory', value: 'In-memory trackers optimized.', inline: false }
                )
                .setTimestamp();

            await msg.edit({ content: null, embeds: [embed] });

            // Log to guild log channel
            const config = db.prepare('SELECT log_channel FROM guild_config WHERE guild_id = ?').get(message.guild.id);
            if (config?.log_channel) {
                const channel = message.guild.channels.cache.get(config.log_channel);
                if (channel) channel.send({ embeds: [embed] });
            }
        } catch (err) {
            await msg.edit('❌ Cleanup failed. Check console for details.');
        }
    },
    runCleanup
};