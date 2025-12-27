const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debugping')
        .setDescription('A simple debug command to verify the bot is responding.'),
    async execute(interaction) {
        const debugping = require('../commands/debugping.js');
        await debugping.execute(interaction, null, interaction.client);
    }
};
