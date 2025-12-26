// Security Presets - Quick configuration for server protection
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

const PRESETS = {
    soft: {
        name: 'Soft',
        description: 'Light protection - Spam only',
        settings: {
            antispam: 1,
            antilink: 0,
            antiraid: 0,
            antinuke: 0,
            aifilter: 0,
            ai_mode: 'lenient',
        },
        tags: ['🟢 Beginner-friendly'],
    },
    balanced: {
        name: 'Balanced',
        description: 'Moderate protection - Good for most servers',
        settings: {
            antispam: 1,
            antilink: 1,
            antiraid: 1,
            antinuke: 1,
            aifilter: 1,
            ai_mode: 'normal',
        },
        tags: ['🟡 Recommended'],
        premium_features: ['aifilter'],
    },
    max: {
        name: 'Max',
        description: 'Maximum protection - Aggressive filtering',
        settings: {
            antispam: 1,
            antilink: 1,
            antiraid: 1,
            antinuke: 1,
            aifilter: 1,
            ai_mode: 'aggressive',
        },
        tags: ['🔴 High security'],
        premium_features: ['aifilter'],
    },
};

module.exports = {
    PRESETS,

    async applyPreset(guild, presetName) {
        const preset = PRESETS[presetName];
        if (!preset) {
            return { success: false, error: 'Invalid preset. Choose: soft, balanced, max' };
        }

        try {
            // Check premium status
            const premium = db.prepare('SELECT expires_at FROM premium_guilds WHERE guild_id = ?').get(guild.id);
            const isPremium = premium && (new Date(premium.expires_at) > new Date());

            // Build settings - exclude premium features if not premium
            const settingsToApply = { ...preset.settings };
            let premiumWarning = null;

            if (preset.premium_features && !isPremium) {
                // Disable premium features if not premium
                preset.premium_features.forEach(feature => {
                    if (feature === 'aifilter') {
                        settingsToApply.aifilter = 0;
                    }
                });
                premiumWarning = `⚠️ AI features disabled (Premium required)`;
            }

            // Get current settings before update
            const currentConfig = db.prepare('SELECT antispam, antilink, antiraid, antinuke, aifilter, ai_mode FROM guild_config WHERE guild_id = ?').get(guild.id) || {};

            // Apply preset settings
            const updates = [];
            const values = [];
            for (const [key, value] of Object.entries(settingsToApply)) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
            values.push(guild.id);

            db.prepare(`UPDATE guild_config SET ${updates.join(', ')} WHERE guild_id = ?`).run(...values);

            // Build change summary
            const changes = [];
            for (const [key, newValue] of Object.entries(settingsToApply)) {
                const oldValue = currentConfig[key];
                if (oldValue !== newValue) {
                    const status = newValue ? '✅' : '❌';
                    const keyName = key === 'ai_mode' ? 'AI Mode' : key.replace(/_/g, ' ').toUpperCase();
                    changes.push(`${status} ${keyName}: ${newValue}`);
                }
            }

            return {
                success: true,
                preset,
                changes,
                premiumWarning,
                isPremium,
            };
        } catch (err) {
            console.error('Preset application error:', err);
            return { success: false, error: 'Failed to apply preset' };
        }
    },

    getPresetList() {
        return PRESETS;
    },
};
