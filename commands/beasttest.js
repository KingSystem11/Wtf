const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const { getEmoji } = require('../utils/emojis');

module.exports = {
    category: "Security",
    name: 'beasttest',
    description: 'Simulate a Beast Mode betrayal scenario (Owner Only)',
    async execute(message, args) {
        // Owner-only check
        const config = require('../configLoader');
        const botOwnerId = config.ownerId;
        if (message.author.id !== botOwnerId) {
            return message.reply(`${getEmoji('ERROR')} This command is **owner-only**.`);
        }

        // Get target user
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply(`${getEmoji('ERROR')} Usage: \`s!beasttest @user\``);
        }

        // Simulation Logic
        const guildConfig = db.query('SELECT beast_enabled, beast_limit_ban, beast_limit_kick, beast_limit_everyone, log_channel FROM guild_config WHERE guild_id = ?', [message.guild.id]);
        if (!guildConfig || !guildConfig.beast_enabled) {
            return message.reply(`${getEmoji('ERROR')} Beast Mode is not enabled on this server.`);
        }

        // Check if server is premium
        const premium = db.query('SELECT expires_at FROM premium_guilds WHERE guild_id = ?', [message.guild.id]);
        const isPremium = premium && (new Date(premium.expires_at) > new Date());
        if (!isPremium) {
            return message.reply(`${getEmoji('ERROR')} Beast Mode requires **PREMIUM**.`);
        }

        try {
            const targetMember = await message.guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember) {
                return message.reply(`${getEmoji('ERROR')} User is not in this server.`);
            }

            // Simulate the betrayal scenario
            const dangerousPerms = [
                'Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'ManageWebhooks', 'BanMembers', 'KickMembers'
            ];
            
            const rolesWithPerms = targetMember.roles.cache.filter(role => 
                dangerousPerms.some(perm => role.permissions.has(perm))
            );

            // Create simulation embed for current channel
            const simulationEmbed = new EmbedBuilder()
                .setTitle(`${getEmoji('BAN')} [BEAST SIMULATION] Betrayal Detected`)
                .setColor(0xFF0000)
                .setDescription(`**Whitelisted user** ${targetUser} (${targetUser.id}) has exceeded Beast Mode limits.`)
                .addFields(
                    { name: 'Scenario', value: 'User crossed the ban/kick/@everyone threshold', inline: false },
                    { name: 'Action Simulated', value: rolesWithPerms.size > 0 
                        ? `Would remove **${rolesWithPerms.size}** administrative role(s):\n${rolesWithPerms.map(r => `• ${r.name}`).join('\n')}`
                        : 'No dangerous roles to remove (user is clean)', 
                        inline: false },
                    { name: 'Limits', value: `Ban: ${guildConfig.beast_limit_ban}\nKick: ${guildConfig.beast_limit_kick}\n@everyone: ${guildConfig.beast_limit_everyone}`, inline: true },
                    { name: 'Status', value: '⚠️ **SIMULATION ONLY** - No action taken', inline: true }
                )
                .setFooter({ text: 'This is a test scenario. No real changes were made.' })
                .setTimestamp();

            // Send to current channel
            await message.reply({ embeds: [simulationEmbed] });

            // Send to log channel if configured
            if (guildConfig.log_channel) {
                const logChannel = message.guild.channels.cache.get(guildConfig.log_channel);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle(`${getEmoji('BAN')} [BEAST SIMULATION] Betrayal Test Executed`)
                        .setColor(0xFF9900)
                        .setDescription(`Owner ${message.author} tested Beast Mode simulation on ${targetUser}.`)
                        .addFields(
                            { name: 'Scenario', value: 'User crossed the ban/kick/@everyone threshold', inline: false },
                            { name: 'Roles That Would Be Removed', value: rolesWithPerms.size > 0 
                                ? `${rolesWithPerms.size} role(s):\n${rolesWithPerms.map(r => `• ${r.name}`).join('\n')}`
                                : 'None (user has no dangerous roles)', 
                                inline: false },
                            { name: 'Limits', value: `Ban: ${guildConfig.beast_limit_ban}\nKick: ${guildConfig.beast_limit_kick}\n@everyone: ${guildConfig.beast_limit_everyone}`, inline: true }
                        )
                        .setFooter({ text: 'Simulation test - no changes made to server' })
                        .setTimestamp();
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Beast Mode test error:', error);
            return message.reply(`${getEmoji('ERROR')} An error occurred during simulation.`);
        }
    }
};
