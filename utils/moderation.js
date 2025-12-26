// OpenAI Moderation API Integration
// Configurable thresholds for different risk categories

// Moderation category thresholds (0.0 - 1.0 scale)
const MODERATION_THRESHOLDS = {
    violence: 0.5,
    hate: 0.5,
    harassment: 0.5,
    self_harm: 0.3,  // Lower threshold for self-harm due to severity
};

// AI Mode multipliers for threshold adjustment
const MODE_MULTIPLIERS = {
    lenient: 1.3,     // 30% higher threshold (less strict)
    normal: 1.0,      // Standard threshold
    aggressive: 0.7,  // 30% lower threshold (more strict)
};

const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    MODERATION_THRESHOLDS,
    MODE_MULTIPLIERS,

    async moderateMessage(messageContent, aiMode = 'normal') {
        const config = require('../configLoader');
        if (!config.openAiKey) {
            console.warn('OPENAI_API_KEY not set, skipping moderation');
            return null;
        }

        try {
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: config.openAiKey });

            // Call moderation endpoint
            const response = await openai.moderations.create({
                input: messageContent,
                model: 'text-moderation-latest',
            });

            if (!response.results || response.results.length === 0) {
                return null;
            }

            const result = response.results[0];
            
            // Apply mode-based threshold adjustment
            const modeMultiplier = MODE_MULTIPLIERS[aiMode] || 1.0;
            
            // Check which categories are flagged
            const flaggedCategories = [];
            const categoryScores = {};

            for (const [category, score] of Object.entries(result.category_scores)) {
                categoryScores[category] = score;
                
                // Map OpenAI category names to our thresholds
                const thresholdKey = category.replace('_', '');
                const baseThreshold = MODERATION_THRESHOLDS[category] || MODERATION_THRESHOLDS[thresholdKey];
                
                if (baseThreshold && score > (baseThreshold / modeMultiplier)) {
                    flaggedCategories.push({
                        category,
                        score: parseFloat(score.toFixed(4)),
                        threshold: parseFloat((baseThreshold / modeMultiplier).toFixed(4)),
                    });
                }
            }

            return {
                isFlagged: flaggedCategories.length > 0,
                categories: flaggedCategories,
                allScores: categoryScores,
                aiMode,
            };
        } catch (err) {
            console.error('Moderation API Error:', err.message);
            return null;
        }
    },

    async logModerationAction(guild, message, result, actionTaken) {
        try {
            const config = db.prepare('SELECT log_channel FROM guild_config WHERE guild_id = ?').get(guild.id);
            if (!config?.log_channel) return;

            const { logEvent } = require('./logger');
            const { getLocalizedString } = require('./localization');
            
            // Build category string
            const categoryStr = result.categories
                .map(c => `${c.category} (${c.score.toFixed(3)})`)
                .join(', ');

            const title = getLocalizedString(guild.id, 'aifilter_log_title');

            const embed = {
                title: `🤖 ${title}`,
                color: 0xFFAA00,
                fields: [
                    { name: 'User', value: `**${message.author.tag}**`, inline: true },
                    { name: 'Mode', value: result.aiMode, inline: true },
                    { name: 'Flagged Categories', value: categoryStr || 'None', inline: false },
                    { name: 'Action Taken', value: actionTaken, inline: true },
                ],
                timestamp: new Date(),
            };

            await logEvent(guild, embed, 'normal');
        } catch (err) {
            console.error('Failed to log moderation action:', err);
        }
    },
};
