const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    category: "Security",
    name: 'verifyme',
    description: 'Assigns the verified role to the user',
    async execute(message) {
        const config = db.prepare('SELECT verified_role_id FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        
        if (!config?.verified_role_id) {
            return message.reply('❌ No verified role has been configured for this server.');
        }

        const role = message.guild.roles.cache.get(config.verified_role_id);
        if (!role) return message.reply('❌ The configured verified role no longer exists.');

        if (message.member.roles.cache.has(role.id)) {
            return message.reply('ℹ️ You are already verified.');
        }

        try {
            await message.member.roles.add(role);
            message.reply('✅ Verification successful! The role has been added.');
        } catch (err) {
            message.reply('❌ I failed to add the role. Please check my permissions.');
        }
    }
};