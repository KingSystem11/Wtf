const fs = require('fs');
const path = require('path');

let configData = {};
try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (error) {
    console.warn('[CONFIG] Failed to load config.json, relying on environment variables.');
}

function maskSecret(secret) {
    if (!secret) return 'MISSING';
    if (secret.length <= 8) return '********';
    return secret.substring(0, 4) + '...' + secret.substring(secret.length - 4);
}

const config = {
    token: process.env.DISCORD_TOKEN || configData.token,
    ownerId: process.env.BOT_OWNER_ID || configData.ownerId,
    openAiKey: process.env.OPENAI_API_KEY || configData.openAiKey,
    prefix: process.env.PREFIX || configData.prefix || 's!'
};

// Validation
if (!config.token) {
    console.error('[CRITICAL] DISCORD_TOKEN is missing! Please provide it in config.json or as an environment variable.');
    process.exit(1);
}

if (!config.ownerId) {
    console.warn('[WARNING] BOT_OWNER_ID is missing. Owner-only commands will not work.');
}

if (!config.openAiKey) {
    console.warn('[WARNING] OPENAI_API_KEY is missing. AI features will be disabled.');
}

console.log(`[CONFIG] Loaded: Prefix="${config.prefix}", OwnerID="${config.ownerId ? 'SET' : 'MISSING'}", Token="${maskSecret(config.token)}"`);

module.exports = config;
