const helpCommand = require('../commands/help');

module.exports = {
    data: helpCommand.data,
    async execute(interaction) {
        await helpCommand.execute(interaction, [], interaction.client);
    }
};
