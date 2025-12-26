const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Check bot latency',
    execute(message) {
        message.reply(`Pong! Latency: ${Date.now() - message.createdTimestamp}ms`);
    }
};