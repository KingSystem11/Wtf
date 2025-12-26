const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

const offenseTracker = new Map(); // guildId-userId -> count
const offenseWindow = 3600000; // 1 hour window

module.exports = {
    async handleOffense(member, reason) {
        if (!member || member.user.bot || !member.guild || !member.manageable) return;

        const key = `${member.guild.id}-${member.id}`;
        let data = offenseTracker.get(key) || { count: 0, last: Date.now() };
        
        // Reset if window passed
        if (Date.now() - data.last > offenseWindow) {
            data.count = 0;
        }

        data.count++;
        data.last = Date.now();
        offenseTracker.set(key, data);

        const config = db.prepare('SELECT punishment_pipeline, log_channel FROM guild_config WHERE guild_id = ?').get(member.guild.id);
        const pipeline = (config?.punishment_pipeline || 'warn,mute10,mute60,kick,ban').split(',');
        
        // Get step based on count, cap at last step
        const stepIndex = Math.min(data.count - 1, pipeline.length - 1);
        const action = pipeline[stepIndex];

        let actionTaken = 'WARN';
        try {
            switch (action) {
                case 'warn':
                    await member.send(`⚠️ **Warning:** You have been warned in **${member.guild.name}** for: ${reason}`).catch(() => {});
                    break;
                case 'mute10':
                    await member.timeout(10 * 60 * 1000, `Pipeline Escalation: ${reason}`);
                    actionTaken = 'MUTE (10m)';
                    break;
                case 'mute60':
                    await member.timeout(60 * 60 * 1000, `Pipeline Escalation: ${reason}`);
                    actionTaken = 'MUTE (60m)';
                    break;
                case 'kick':
                    await member.kick(`Pipeline Escalation: ${reason}`);
                    actionTaken = 'KICK';
                    break;
                case 'ban':
                    await member.ban({ reason: `Pipeline Escalation: ${reason}` });
                    actionTaken = 'BAN';
                    break;
            }

            // Log it
            const { logEvent } = require('./logger');
            const logChannelId = config?.log_channel;
            if (logChannelId) {
                const embed = {
                    title: '⚖️ Pipeline Punishment Applied',
                    color: 0xFF0000,
                    description: `User: **${member.user.tag}**\nAction: **${actionTaken}** (Offense #${data.count})\nReason: ${reason}`,
                    timestamp: new Date()
                };
                await logEvent(member.guild, embed, 'normal');
            }
        } catch (err) {
            console.error('Pipeline error:', err);
        }
    }
};