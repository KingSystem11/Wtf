const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'reload',
    description: 'Reloads a specific command file (Owner Only)',
    ownerOnly: true,
    async execute(message, args, client) {
        const ownerId = process.env.BOT_OWNER_ID;
        if (!ownerId) return message.reply('❌ BOT_OWNER_ID not configured.');
        
        if (message.author.id !== ownerId) {
            return message.reply('❌ This command is restricted to the bot owner.');
        }

        if (!args.length) return message.reply('Please provide a command name to reload.');
        const commandName = args[0].toLowerCase();
        const command = client.commands.get(commandName);

        if (!command) return message.reply(`There is no command with name \`${commandName}\`.`);

        const commandPath = path.join(__dirname, `${command.name}.js`);
        
        if (!fs.existsSync(commandPath)) {
            return message.reply(`File for command \`${commandName}\` does not exist!`);
        }

        delete require.cache[require.resolve(commandPath)];

        try {
            const newCommand = require(commandPath);
            client.commands.set(newCommand.name, newCommand);

            const embed = new EmbedBuilder()
                .setTitle('♻️ Command Reloaded')
                .setColor('#00FF00')
                .setDescription(`Command \`${newCommand.name}\` has been reloaded successfully.`)
                .setTimestamp();

            message.reply({ embeds: [embed] });

            // Log to log channel
            const config = db.prepare('SELECT log_channel FROM guild_config WHERE guild_id = ?').get(message.guild.id);
            if (config?.log_channel) {
                const channel = message.guild.channels.cache.get(config.log_channel);
                if (channel) channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            message.reply(`There was an error while reloading command \`${commandName}\`:\n\`${error.message}\``);
        }
    }
};