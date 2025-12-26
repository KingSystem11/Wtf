const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const { getEmoji } = require('../utils/emojis');
const { canUseCommand, isOwner } = require('../utils/permissions');

const db = new Database('./data/spectre.db');

module.exports = {
    name: 'describe',
    description: 'Get detailed information about a command',
    async execute(message, args, client) {
        const commandName = args[0]?.toLowerCase();

        if (!commandName) {
            return message.reply(`${getEmoji('ERROR')} Usage: \`s!describe <commandName>\``);
        }

        // Find command by name or alias
        let command = client.commands.get(commandName);
        if (!command) {
            // Search by alias
            command = client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        }

        if (!command) {
            return message.reply(`${getEmoji('ERROR')} Command not found.`);
        }

        // Permission check using centralized helper
        const config = db.prepare('SELECT staff_role_id FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        
        // Check if command should be hidden from this user
        if (!canUseCommand(message.member, command, config)) {
            return message.reply(`${getEmoji('ERROR')} Command not found.`);
        }

        // Determine category
        const categories = {
            'General': ['help', 'info', 'ping', 'privacy', 'checkhelp', 'describe'],
            'Moderation': ['ban', 'kick', 'mute', 'unmute', 'warn', 'case', 'why', 'unban'],
            'Security': ['antinuke', 'antiraid', 'antilink', 'antispam', 'panic', 'spectrelockdown', 'lock', 'unlock', 'serverlock', 'slowmode', 'setlog', 'setstaffrole', 'loglevel', 'perms', 'exportlogs', 'webhookscan', 'usage', 'cleanup', 'securitylevel', 'setupsecurity', 'verifyme', 'setverifiedrole', 'pipeline', 'spectreconfig', 'setlang', 'reload', 'shutdown', 'debugconfig', 'devstatus', 'sim', 'genlicense', 'resetsecurity', 'resetall', 'filter', 'chanset'],
            'AI/Premium': ['activatelicense', 'aifilter', 'aimode', 'ailogs', 'premium', 'backup', 'restore'],
            'Verification': ['verify', 'verifysetup', 'setverifiedrole'],
            'Utility': ['jsonstatus', 'incident', 'preset', 'globalban'],
        };

        let category = 'Uncategorized';
        for (const [cat, cmds] of Object.entries(categories)) {
            if (cmds.includes(command.name)) {
                category = cat;
                break;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`${getEmoji('INFO')} ${command.name}`)
            .setColor('#5865F2')
            .addFields(
                { name: 'Description', value: command.description || 'No description', inline: false },
                { name: 'Category', value: category, inline: true },
                { name: 'Aliases', value: command.aliases && command.aliases.length > 0 ? `\`${command.aliases.join(', ')}\`` : 'None', inline: true }
            );

        if (command.usage) {
            embed.addFields({ name: 'Usage', value: `\`${command.usage}\``, inline: false });
        } else {
            embed.addFields({ name: 'Usage', value: `\`s!${command.name}\` (no args)`, inline: false });
        }

        const tags = [];
        if (command.premium) tags.push(`${getEmoji('PREMIUM')} Premium`);
        if (command.ownerOnly) tags.push('👑 Owner Only');
        if (command.staffOnly) tags.push(`${getEmoji('SECURITY')} Staff Only`);

        if (tags.length > 0) {
            embed.addFields({ name: 'Tags', value: tags.join(' • '), inline: false });
        }

        message.reply({ embeds: [embed] });
    }
};
