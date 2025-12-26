const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'verifysetup',
    description: 'Set up verification channel',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Administrators only.');
        }

        const channel = message.mentions.channels.first();

        if (!channel) {
            return message.reply('❌ Please mention a channel. Usage: `s!verifysetup #channel`');
        }

        try {
            // Update guild config
            db.prepare('UPDATE guild_config SET verification_channel = ? WHERE guild_id = ?').run(channel.id, message.guild.id);

            // Send info message in the channel
            const infoMessage = `
🔐 **Verification Channel**

When you join this server, the bot will send you a verification code via DM.

📋 To verify, use the command in this channel (or any channel):
\`\`\`
s!verify <code>
\`\`\`

Once verified, you'll gain access to the server.
            `.trim();

            await channel.send({ content: infoMessage });

            message.reply(`✅ Verification channel set to <#${channel.id}>. Members will be challenged to verify upon joining.`);
        } catch (err) {
            console.error('Verify setup error:', err);
            message.reply('❌ Failed to set up verification channel.');
        }
    }
};
