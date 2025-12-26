const fs = require('fs');
const path = require('path');

let emojiCache = null;

function loadEmojis() {
    if (emojiCache) return emojiCache;
    
    try {
        const emojiPath = path.join(__dirname, '../emoji.json');
        const data = fs.readFileSync(emojiPath, 'utf-8');
        emojiCache = JSON.parse(data);
        return emojiCache;
    } catch (err) {
        console.error('Failed to load emoji.json:', err);
        return {};
    }
}

function getEmoji(key) {
    const emojis = loadEmojis();
    return emojis[key] || '•';
}

function makeEmbed(type, title, description) {
    const { EmbedBuilder } = require('discord.js');
    const emoji = getEmoji(type);
    
    const colorMap = {
        'SUCCESS': 0x00FF00,
        'ERROR': 0xFF0000,
        'WARN': 0xFFAA00,
        'INFO': 0x0099FF,
        'SECURITY': 0xFF00FF,
        'MOD': 0x8800FF,
        'BAN': 0xFF0000,
        'KICK': 0xFF6600,
        'MUTE': 0xFF9900,
        'RAID': 0xFF0000,
        'NUKE': 0xFF0000,
        'SPAM': 0xFFAA00,
        'AI': 0x00FF00,
        'PREMIUM': 0xFFD700,
        'BACKUP': 0x0099FF,
        'RESTORE': 0x00FF00,
        'PIPELINE': 0x0099FF,
        'LOG': 0x0099FF,
        'CASE': 0x0099FF,
        'SETTINGS': 0x8800FF,
        'LINK': 0xFFAA00,
        'SECURITY_OK': 0x00FF00,
        'SECURITY_WARN': 0xFFAA00,
        'SECURITY_DANGER': 0xFF0000
    };
    
    const color = colorMap[type] || 0x0099FF;
    
    return new EmbedBuilder()
        .setTitle(`${emoji} ${title}`)
        .setDescription(description)
        .setColor(color);
}

module.exports = {
    getEmoji,
    makeEmbed,
    loadEmojis
};
