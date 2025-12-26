const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('./data/spectre.db');
const strings = require('../utils/strings');
const { isStaff, isOwner } = require('../utils/permissions');

module.exports = {
    name: 'help',
    description: 'List all commands',
    async execute(message, args, client) {
        const config = db.prepare('SELECT staff_role_id, language FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        const lang = config?.language || 'en';
        const langStrings = strings[lang] || strings.en;
        
        const memberIsStaff = isStaff(message.member, config);
        const memberIsOwner = isOwner(message.member);

        const categories = {
            'General': [
                { name: 's!ping', desc: 'Check bot latency', staff: false },
                { name: 's!help', desc: 'Show this menu', staff: false },
                { name: 's!info', desc: 'Bot information', staff: false },
                { name: 's!privacy', desc: 'Privacy information', staff: false }
            ],
            'Moderation': [
                { name: 's!why', desc: 'Show your cases', staff: false },
                { name: 's!ban', desc: 'Ban a member', staff: true },
                { name: 's!kick', desc: 'Kick a member', staff: true },
                { name: 's!mute', desc: 'Timeout a member', staff: true },
                { name: 's!unmute', desc: 'Remove timeout', staff: true },
                { name: 's!warn', desc: 'Warn a member', staff: true },
                { name: 's!case', desc: 'View case details', staff: true }
            ],
            'Security': [
                { name: 's!antinuke', desc: 'Configure anti-nuke', staff: true },
                { name: 's!antiraid', desc: 'Configure anti-raid', staff: true },
                { name: 's!antilink', desc: 'Configure anti-link', staff: true },
                { name: 's!antispam', desc: 'Configure anti-spam', staff: true },
                { name: 's!panic', desc: 'Emergency lockdown', staff: true },
                { name: 's!spectrelockdown', desc: 'Ultimate lockdown', owner: true },
                { name: 's!lock', desc: 'Lock channel', staff: true },
                { name: 's!unlock', desc: 'Unlock channel', staff: true },
                { name: 's!serverlock', desc: 'Lock server', staff: true },
                { name: 's!slowmode', desc: 'Set slowmode', staff: true },
                { name: 's!setlog', desc: 'Set log channel', staff: true },
                { name: 's!setstaffrole', desc: 'Set staff role', staff: true },
                { name: 's!loglevel', desc: 'Set log level', staff: true },
                { name: 's!perms', desc: 'Show permissions', staff: false },
                { name: 's!exportlogs', desc: 'Export logs to .txt', staff: true },
                { name: 's!webhookscan', desc: 'Scan for webhooks', staff: true },
                { name: 's!usage', desc: 'Check command usage', staff: true },
                { name: 's!cleanup', desc: 'Prune old logs', staff: true },
                { name: 's!securitylevel', desc: 'Check security posture', staff: true },
                { name: 's!setupsecurity', desc: 'Interactive setup', staff: true },
                { name: 's!verifyme', desc: 'Get verified role', staff: false },
                { name: 's!setverifiedrole', desc: 'Set verified role', staff: true },
                { name: 's!pipeline', desc: 'Escalating punishments', staff: true },
                { name: 's!spectreconfig', desc: 'Show config', owner: true },
                { name: 's!setlang', desc: 'Set language', staff: true },
                { name: 's!reload', desc: 'Reload command', owner: true },
                { name: 's!shutdown', desc: 'Bot shutdown', owner: true },
                { name: 's!debugconfig', desc: 'Debug guild config', owner: true },
                { name: 's!devstatus', desc: 'Dev mode status', owner: true },
                { name: 's!sim', desc: 'Simulate events', owner: true },
                { name: 's!genlicense', desc: 'Generate license', owner: true },
                { name: 's!resetsecurity', desc: 'Reset security', owner: true },
                { name: 's!resetall', desc: 'Factory reset', owner: true }
            ],
            'AI/Premium': [
                { name: 's!activatelicense', desc: 'Activate premium', staff: false },
                { name: 's!aifilter', desc: 'Toggle AI filter', staff: true, premium: true },
                { name: 's!aimode', desc: 'Set AI sensitivity', staff: true, premium: true },
                { name: 's!ailogs', desc: 'Show AI logs', staff: true, premium: true },
                { name: 's!premium', desc: 'Premium status', staff: false },
                { name: 's!backup', desc: 'Backup config', owner: true },
                { name: 's!restore', desc: 'Restore config', owner: true }
            ]
        };

        const helpEmbed = new EmbedBuilder()
            .setTitle(langStrings.help_title)
            .setColor('#00FF00')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: langStrings.help_footer })
            .setTimestamp();

        for (const [category, commands] of Object.entries(categories)) {
            let cmdList = '';
            for (const cmd of commands) {
                // Permission checks
                if (cmd.owner && !memberIsOwner) continue;
                if (cmd.staff && !memberIsStaff) continue;

                const premiumTag = cmd.premium ? ' ⭐' : '';
                const aliasStr = cmd.aliases ? ` (aliases: \`${cmd.aliases.join(', ')}\`)` : '';
                cmdList += `\`${cmd.name}\`${aliasStr} - ${cmd.desc}${premiumTag}\n`;
            }

            if (cmdList) {
                helpEmbed.addFields({ name: category, value: cmdList });
            }
        }

        message.reply({ embeds: [helpEmbed] });
    }
};