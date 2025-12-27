const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const strings = require('../utils/strings');

module.exports = {
    category: "Security",
    name: 'setlang',
    description: 'Set the bot language for this server',
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Only administrators can change the language.');
        }

        const lang = args[0]?.toLowerCase();
        const supported = ['en', 'hi', 'sp', 'ru', 'ge'];

        if (!supported.includes(lang)) {
            return message.reply(`Usage: \`s!setlang <${supported.join('/')}>\``);
        }

        db.prepare('INSERT INTO guild_config (guild_id, language) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET language = EXCLUDED.language').run(message.guild.id, lang);

        message.reply(strings[lang].lang_set);

        const { logEvent } = require('../utils/logger');
        const embed = new EmbedBuilder()
            .setTitle('🌐 Language Changed')
            .setColor('#00FF00')
            .setDescription(`Server language has been updated to **${lang.toUpperCase()}**.`)
            .setTimestamp();
        await logEvent(message.guild, embed, 'minor');
    }
};