// Central emoji configuration loader
const emojiMap = require('../emoji.json');

module.exports = {
    getEmoji(key) {
        return emojiMap[key] || '❓';
    },

    getAllEmojis() {
        return emojiMap;
    },
};
