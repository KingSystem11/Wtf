const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getEmoji } = require('../utils/emojis');

// Hardcoded help categories (match help.js exactly)
const helpCategories = {
    'General': [
        's!ping', 's!help', 's!info', 's!privacy'
    ],
    'Moderation': [
        's!why', 's!ban', 's!kick', 's!mute', 's!unmute', 's!warn', 's!case'
    ],
    'Security': [
        's!antinuke', 's!antiraid', 's!antilink', 's!antispam', 's!panic', 's!spectrelockdown',
        's!lock', 's!unlock', 's!serverlock', 's!slowmode', 's!setlog', 's!setstaffrole',
        's!loglevel', 's!perms', 's!exportlogs', 's!webhookscan', 's!usage', 's!cleanup',
        's!securitylevel', 's!setupsecurity', 's!verifyme', 's!setverifiedrole', 's!pipeline',
        's!spectreconfig', 's!setlang', 's!reload', 's!shutdown', 's!debugconfig', 's!devstatus',
        's!sim', 's!genlicense', 's!resetsecurity', 's!resetall'
    ],
    'AI/Premium': [
        's!activatelicense', 's!aifilter', 's!aimode', 's!ailogs', 's!premium', 's!backup', 's!restore'
    ]
};

function verifyCommandsInHelp(client) {
    // Get all command names from client
    const allCommands = new Set(client.commands.keys());
    
    // Get all commands listed in help
    const helpCommands = new Set();
    for (const commands of Object.values(helpCategories)) {
        commands.forEach(cmd => {
            const cmdName = cmd.replace('s!', '');
            helpCommands.add(cmdName);
        });
    }

    // Find missing commands
    const missing = [];
    for (const cmd of allCommands) {
        // Skip aliases and internal commands
        const command = client.commands.get(cmd);
        if (command && !command.hidden) {
            if (!helpCommands.has(cmd)) {
                missing.push(cmd);
            }
        }
    }

    return {
        totalLoaded: allCommands.size,
        totalInHelp: helpCommands.size,
        missing: missing.sort(),
    };
}

module.exports = {
    category: "Security",
    name: 'checkhelp',
    description: 'Verify all commands are in help menu',
    ownerOnly: true,
    async execute(message, args, client) {
        // Owner-only check
        if (message.author.id !== message.guild.ownerId) {
            return message.reply(`${getEmoji('ERROR')} Guild owner only.`);
        }

        const result = verifyCommandsInHelp(client);

        const embed = new EmbedBuilder()
            .setTitle(`${getEmoji('INFO')} Command Help Verification`)
            .setColor(result.missing.length === 0 ? '#00FF00' : '#FFAA00')
            .addFields(
                { name: 'Total Commands Loaded', value: result.totalLoaded.toString(), inline: true },
                { name: 'Commands in Help', value: result.totalInHelp.toString(), inline: true },
                { name: 'Missing from Help', value: result.missing.length.toString(), inline: true }
            );

        if (result.missing.length > 0) {
            const missingList = result.missing.slice(0, 15).join(', ');
            const suffix = result.missing.length > 15 ? ` +${result.missing.length - 15} more` : '';
            embed.addFields({ name: 'Missing Commands', value: `\`${missingList}\`${suffix}`, inline: false });
        }

        message.reply({ embeds: [embed] });
    }
};
