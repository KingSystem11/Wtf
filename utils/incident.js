// Incident Report Generator - compiles user's recent infractions
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    async generateIncidentReport(guild, userId) {
        const report = {
            userId,
            cases: [],
            aiHits: [],
            antinukeEvents: [],
            failedVerifications: [],
            totalInfractions: 0,
        };

        try {
            // Get moderation cases (last 10)
            const cases = db.prepare(`
                SELECT id, action, reason, date FROM cases
                WHERE guild_id = ? AND user_id = ?
                ORDER BY date DESC
                LIMIT 10
            `).all(guild.id, userId);
            report.cases = cases;

            // Get AI moderation hits (last 10)
            const aiHits = db.prepare(`
                SELECT id, action, risk_score, created_at FROM ai_logs
                WHERE guild_id = ? AND user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            `).all(guild.id, userId);
            report.aiHits = aiHits;

            // Get anti-nuke events (last 10)
            const antinukeEvents = db.prepare(`
                SELECT id, type, count, created_at FROM antinuke_cases
                WHERE guild_id = ? AND executor_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            `).all(guild.id, userId);
            report.antinukeEvents = antinukeEvents;

            // Get failed verification attempts (last 5)
            const failedVerifications = db.prepare(`
                SELECT id, attempts, created_at FROM verification_codes
                WHERE guild_id = ? AND user_id = ? AND failed = 1
                ORDER BY created_at DESC
                LIMIT 5
            `).all(guild.id, userId);
            report.failedVerifications = failedVerifications;

            // Calculate total infractions
            report.totalInfractions = cases.length + aiHits.length + antinukeEvents.length + failedVerifications.length;

            return report;
        } catch (err) {
            console.error('Incident report generation error:', err);
            return null;
        }
    },

    formatIncidentEmbed(guild, user, report) {
        const fields = [];

        // Summary section
        fields.push({
            name: '📊 Summary',
            value: `Total Infractions: **${report.totalInfractions}**\nUser: **${user.tag}** (${user.id})`,
            inline: false,
        });

        // Moderation Cases
        if (report.cases.length > 0) {
            const casesList = report.cases
                .slice(0, 5)
                .map(c => `• **${c.action}** - ${c.reason || 'No reason'}\n  <t:${Math.floor(new Date(c.date).getTime() / 1000)}:R>`)
                .join('\n');
            
            fields.push({
                name: '⚖️ Moderation Cases',
                value: casesList || 'None',
                inline: false,
            });
        }

        // AI Moderation Hits
        if (report.aiHits.length > 0) {
            const aiList = report.aiHits
                .slice(0, 5)
                .map(h => `• **${h.action}** - Score: ${h.risk_score}\n  <t:${Math.floor(new Date(h.created_at).getTime() / 1000)}:R>`)
                .join('\n');
            
            fields.push({
                name: '🤖 AI Moderation Hits',
                value: aiList || 'None',
                inline: false,
            });
        }

        // Anti-Nuke Events
        if (report.antinukeEvents.length > 0) {
            const nukeList = report.antinukeEvents
                .slice(0, 5)
                .map(e => `• **${e.type}** - Count: ${e.count}\n  <t:${Math.floor(new Date(e.created_at).getTime() / 1000)}:R>`)
                .join('\n');
            
            fields.push({
                name: '💣 Anti-Nuke Events',
                value: nukeList || 'None',
                inline: false,
            });
        }

        // Failed Verifications
        if (report.failedVerifications.length > 0) {
            const verifyList = report.failedVerifications
                .map(v => `• **Failed Verification** - ${v.attempts} attempts\n  <t:${Math.floor(new Date(v.created_at).getTime() / 1000)}:R>`)
                .join('\n');
            
            fields.push({
                name: '🔐 Failed Verifications',
                value: verifyList || 'None',
                inline: false,
            });
        }

        // If no infractions
        if (report.totalInfractions === 0) {
            fields.push({
                name: '✅ Status',
                value: 'No infractions found for this user in this guild.',
                inline: false,
            });
        }

        return {
            title: '📋 Incident Report',
            color: report.totalInfractions > 5 ? 0xFF0000 : (report.totalInfractions > 0 ? 0xFFAA00 : 0x00FF00),
            fields,
            footer: { text: `Guild: ${guild.name}` },
            timestamp: new Date(),
        };
    },
};
