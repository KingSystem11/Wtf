const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'verify',
    description: 'Submit your verification code',
    async execute(message, args) {
        // This command should only work in DMs or verification channel
        const code = args[0];

        if (!code) {
            return message.reply('Please provide your verification code. Usage: `s!verify <code>`');
        }

        // Allow verification in DMs or any channel
        if (!message.guild) {
            // DM - inform user to use in guild
            return message.reply('Verification must be completed in your server.');
        }

        try {
            const { verifyCode, logVerificationAction } = require('../utils/verification');
            const result = await verifyCode(message.member, code);

            if (result.success) {
                await message.reply(`✅ ${result.message}`);
                await logVerificationAction(message.guild, message.member, 'verified', `Code: ${code}`);
            } else {
                await message.reply(`❌ ${result.message}`);
                
                if (result.failed) {
                    await logVerificationAction(message.guild, message.member, 'verification_failed', `Too many attempts with code: ${code}`);
                }
            }
        } catch (err) {
            console.error('Verify command error:', err);
            message.reply('❌ Verification error. Please try again or contact a moderator.');
        }
    }
};
