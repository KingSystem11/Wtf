const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');

module.exports = {
    name: 'filter',
    description: 'Manage word and regex filters',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You do not have permission.');
        }

        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'add') {
            const pattern = args[1];
            const action = args[2]?.toLowerCase();

            if (!pattern || !action) {
                return message.reply('Usage: `s!filter add <word or regex> <delete|warn|mute>`');
            }

            if (!['delete', 'warn', 'mute'].includes(action)) {
                return message.reply('Action must be: `delete`, `warn`, or `mute`');
            }

            // Detect type: if it looks like regex (has regex chars), ask to confirm or assume word
            let type = 'word';
            const regexChars = /[.*+?^${}()|[\]\\]/;
            let typeLabel = 'word';

            if (regexChars.test(pattern)) {
                type = 'regex';
                typeLabel = 'regex';
                
                // Validate regex
                try {
                    new RegExp(pattern);
                } catch (e) {
                    return message.reply(`❌ Invalid regex pattern: ${e.message}`);
                }
            }

            try {
                db.prepare('INSERT INTO word_filters (guild_id, pattern, type, action) VALUES (?, ?, ?, ?)').run(
                    message.guild.id,
                    pattern,
                    type,
                    action
                );
                
                message.reply(`✅ Added **${typeLabel}** filter: \`${pattern}\` → **${action}**`);
            } catch (err) {
                console.error('Filter add error:', err);
                message.reply('❌ Failed to add filter. Pattern might already exist.');
            }
            return;
        }

        if (subcommand === 'remove') {
            const id = args[1];

            if (!id || isNaN(id)) {
                return message.reply('Usage: `s!filter remove <id>`');
            }

            try {
                const result = db.prepare('DELETE FROM word_filters WHERE id = ? AND guild_id = ?').run(id, message.guild.id);
                
                if (result.changes === 0) {
                    return message.reply('❌ Filter not found.');
                }
                
                message.reply(`✅ Removed filter ID **${id}**.`);
            } catch (err) {
                console.error('Filter remove error:', err);
                message.reply('❌ Failed to remove filter.');
            }
            return;
        }

        if (subcommand === 'list') {
            try {
                const filters = db.prepare('SELECT id, pattern, type, action FROM word_filters WHERE guild_id = ?').all(message.guild.id);
                
                if (filters.length === 0) {
                    return message.reply('No filters configured.');
                }

                let list = '📋 **Active Filters:**\n';
                filters.forEach(f => {
                    const typeLabel = f.type === 'regex' ? '(Regex)' : '(Word)';
                    list += `\n**ID ${f.id}** | \`${f.pattern}\` ${typeLabel} → **${f.action}**`;
                });

                message.reply(list);
            } catch (err) {
                console.error('Filter list error:', err);
                message.reply('❌ Failed to fetch filters.');
            }
            return;
        }

        message.reply('Usage:\n`s!filter add <pattern> <delete|warn|mute>`\n`s!filter remove <id>`\n`s!filter list`');
    }
};
