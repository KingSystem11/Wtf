const { Client, GatewayIntentBits, Collection, PermissionFlagsBits, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Database Setup
const db = new Database('./data/spectre.db');
db.prepare('CREATE TABLE IF NOT EXISTS guild_config (guild_id TEXT PRIMARY KEY, prefix TEXT, log_channel TEXT, antinuke INTEGER DEFAULT 0, aifilter INTEGER DEFAULT 0, antispam INTEGER DEFAULT 0, max_messages INTEGER DEFAULT 8, interval INTEGER DEFAULT 5, antilink INTEGER DEFAULT 0, antiraid INTEGER DEFAULT 0, max_joins INTEGER DEFAULT 10, antinuke_limit INTEGER DEFAULT 3, antinuke_window INTEGER DEFAULT 30, panic_mode INTEGER DEFAULT 0, staff_role_id TEXT, language TEXT DEFAULT "en", verified_role_id TEXT, ai_mode TEXT DEFAULT "normal", punishment_pipeline TEXT DEFAULT "warn,mute10,mute60,kick,ban", log_level TEXT DEFAULT "normal", verification_channel TEXT, globalban_enabled INTEGER DEFAULT 0, debug INTEGER DEFAULT 0, anti_everyone INTEGER DEFAULT 0, beast_enabled INTEGER DEFAULT 0, beast_limit_ban INTEGER DEFAULT 3, beast_limit_kick INTEGER DEFAULT 5, beast_limit_everyone INTEGER DEFAULT 2)').run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS premium_guilds (
        guild_id TEXT PRIMARY KEY,
        activated_by TEXT,
        activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
    )
`).run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        data_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS antinuke_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        executor_id TEXT,
        type TEXT,
        count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();
db.prepare('CREATE TABLE IF NOT EXISTS whitelist (guild_id TEXT, domain TEXT, PRIMARY KEY(guild_id, domain))').run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS channel_overrides (
        guild_id TEXT,
        channel_id TEXT,
        antispam INTEGER,
        antilink INTEGER,
        aifilter INTEGER,
        PRIMARY KEY(guild_id, channel_id)
    )
`).run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS global_bans (
        user_id TEXT PRIMARY KEY,
        reason TEXT,
        added_by_guild_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS word_filters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        pattern TEXT,
        type TEXT,
        action TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        code TEXT,
        attempts INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        verified_at DATETIME
    )
`).run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS ai_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        content TEXT,
        risk_score TEXT,
        action TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        moderator_id TEXT,
        action TEXT,
        reason TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();
db.prepare(`
    CREATE TABLE IF NOT EXISTS command_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        command_name TEXT,
        uses INTEGER DEFAULT 0,
        last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(guild_id, command_name)
    )
`).run();

// Anti-Nuke Tracking
const recentActions = new Map();

async function checkAntiNuke(guild, executor, type) {
    if (!executor || executor.bot) return;
    
    const { isWhitelisted, logWhitelistSkip } = require('./utils/whitelist');
    const { trackBeastAction } = require('./utils/beast');

    // Beast Mode tracking for administrative actions
    if (['ban', 'kick'].includes(type)) {
        await trackBeastAction(guild, executor, type);
    }

    const member = await guild.members.fetch(executor.id).catch(() => null);
    if (member && isWhitelisted(member, 'antinuke')) {
        await logWhitelistSkip(guild, executor, 'antinuke');
        return;
    }

    const config = db.prepare('SELECT antinuke, antinuke_limit, antinuke_window, log_channel, debug FROM guild_config WHERE guild_id = ?').get(guild.id);
    if (!config || !config.antinuke) return;

    if (config.debug) console.log(`[DEBUG] [${guild.id}] Anti-Nuke check for ${type} triggered by ${executor?.tag}`);

    const key = `${guild.id}-${executor.id}-${type}`;
    const now = Date.now();
    const actions = recentActions.get(key) || [];
    const windowMs = config.antinuke_window * 1000;
    
    const filteredActions = actions.filter(t => now - t < windowMs);
    filteredActions.push(now);
    recentActions.set(key, filteredActions);

    if (filteredActions.length > config.antinuke_limit) {
        try {
            const member = await guild.members.fetch(executor.id);
            if (member.id === guild.ownerId) return;

            // Remove dangerous perms (Admin, ManageGuild, ManageChannels, ManageRoles, ManageWebhooks)
            const dangerousPerms = [
                PermissionFlagsBits.Administrator,
                PermissionFlagsBits.ManageGuild,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.ManageWebhooks
            ];
            
            const rolesWithPerms = member.roles.cache.filter(role => 
                dangerousPerms.some(perm => role.permissions.has(perm))
            );

            if (rolesWithPerms.size > 0) {
                await member.roles.remove(rolesWithPerms);
            }

            db.prepare('INSERT INTO antinuke_cases (guild_id, executor_id, type, count) VALUES (?, ?, ?, ?)').run(
                guild.id, executor.id, type, filteredActions.length
            );

            const { logEvent } = require('./utils/logger');
            const logChannel = guild.channels.cache.get(config.log_channel);
            const embed = {
                title: '🚨 Anti-Nuke Triggered',
                color: 0xFF0000,
                description: `User **${executor.tag}** performed mass **${type}** (${filteredActions.length} actions). Their administrative roles have been removed.`,
                timestamp: new Date()
            };
            await logEvent(guild, embed, 'critical');
            // Clear to prevent repeat triggers for same window
            recentActions.set(key, []);
        } catch (e) {
            console.error('Anti-nuke action failed:', e);
        }
    }
}

client.on('channelCreate', async channel => {
    const auditLogs = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 });
    const entry = auditLogs.entries.first();
    checkAntiNuke(channel.guild, entry?.executor, 'channel creation');
});

client.on('channelDelete', async channel => {
    const auditLogs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 });
    const entry = auditLogs.entries.first();
    checkAntiNuke(channel.guild, entry?.executor, 'channel deletion');
});

client.on('roleCreate', async role => {
    const auditLogs = await role.guild.fetchAuditLogs({ type: 30, limit: 1 });
    const entry = auditLogs.entries.first();
    checkAntiNuke(role.guild, entry?.executor, 'role creation');
});

client.on('roleDelete', async role => {
    const auditLogs = await role.guild.fetchAuditLogs({ type: 32, limit: 1 });
    const entry = auditLogs.entries.first();
    checkAntiNuke(role.guild, entry?.executor, 'role deletion');
});

client.on('webhookUpdate', async (channel) => {
    const auditLogs = await channel.guild.fetchAuditLogs({ type: 76, limit: 1 });
    const entry = auditLogs.entries.first();
    if (entry && entry.action === 76) { // Webhook Create
        checkAntiNuke(channel.guild, entry.executor, 'webhook creation');
    }
});

// Process-level error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    broadcastToAllLogs('Unhandled Rejection', reason?.message || 'Unknown error');
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    broadcastToAllLogs('Uncaught Exception', err?.message || 'Unknown error');
});

async function broadcastToAllLogs(title, errorMessage) {
    const { logEvent } = require('./utils/logger');
    const guilds = client.guilds.cache;
    
    for (const [id, guild] of guilds) {
        try {
            const embed = {
                title: `⚠️ Spectre System Error: ${title}`,
                color: 0xFF0000,
                description: `A system error occurred: \`${errorMessage}\`\n\nRestart Spectre or contact the bot owner if this repeats.`,
                timestamp: new Date()
            };
            await logEvent(guild, embed, 'critical');
        } catch (e) {
            // Silently fail if logging to a specific guild fails
        }
    }
}

// Cooldown Tracking
const cooldowns = new Map();

// Command Handler
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    } catch (err) {
        console.error(`Failed to load command ${file}:`, err);
    }
}

// Slash Command Handler
client.slashCommands = new Collection();
const slashCommandFiles = fs.readdirSync('./slashcommands').filter(file => file.endsWith('.js'));

for (const file of slashCommandFiles) {
    try {
        const slashCommand = require(`./slashcommands/${file}`);
        client.slashCommands.set(slashCommand.data.name, slashCommand);
    } catch (err) {
        console.error(`Failed to load slash command ${file}:`, err);
    }
}

client.once('ready', async () => {
    try {
        console.log(`Logged in as ${client.user.tag}`);
        
        const statuses = [
            { name: '👻 Protecting | s!help', type: ActivityType.Playing },
            { name: 'Watching servers for raids', type: ActivityType.Watching },
            { name: 'Securing your Discord', type: ActivityType.Competing }
        ];

        let i = 0;
        setInterval(() => {
            try {
                client.user.setActivity(statuses[i].name, { type: statuses[i].type });
                i = (i + 1) % statuses.length;
            } catch (e) {
                console.error('Failed to update status:', e);
            }
        }, 60000);

        // Initial status
        client.user.setActivity(statuses[0].name, { type: statuses[0].type });

        // Scheduled Cleanup Job (Every 6 hours)
        const { runCleanup } = require('./commands/cleanup');
        setInterval(() => {
            runCleanup(client).catch(console.error);
        }, 6 * 60 * 60 * 1000);

        // Initial Config Validation
        const { validateGuildConfig } = require('./commands/validateconfig');
        client.guilds.cache.forEach(async (guild) => {
            try {
                const result = await validateGuildConfig(guild);
                if (result.repaired) {
                    console.log(`[ConfigValidator] Repaired config for guild ${guild.name} (${guild.id})`);
                }
            } catch (err) {
                console.error(`[ConfigValidator] Failed to validate ${guild.id}:`, err);
            }
        });

        // Register slash commands globally
        const slashCommandData = Array.from(client.slashCommands.values()).map(cmd => cmd.data.toJSON());
        if (slashCommandData.length > 0) {
            try {
                await client.application.commands.set(slashCommandData);
                console.log(`[SlashCommands] Registered ${slashCommandData.length} global slash commands`);
            } catch (err) {
                console.error('[SlashCommands] Failed to register commands:', err);
            }
        }
    } catch (err) {
        console.error('Error in ready event:', err);
    }
});

// Anti-Raid Tracking
const joinLog = new Map();

client.on('guildMemberAdd', async member => {
    const guild = member.guild;
    const config = db.prepare('SELECT antiraid, max_joins, log_channel, panic_mode, verification_channel, verified_role_id, globalban_enabled, debug FROM guild_config WHERE guild_id = ?').get(guild.id);
    
    if (config?.debug) console.log(`[DEBUG] [${guild.id}] Member join: ${member.user.tag}`);
    
    // Check global ban list if enabled
    if (config?.globalban_enabled) {
        try {
            const { isGloballyBanned, getGlobalBan, logGlobalBanAction } = require('./utils/globalban');
            if (isGloballyBanned(member.id)) {
                const banInfo = getGlobalBan(member.id);
                
                try {
                    await member.ban({ reason: `Global ban: ${banInfo.reason}` });
                    await logGlobalBanAction(guild, member.id, 'auto_ban', `Reason: ${banInfo.reason}`);
                } catch (e) {
                    // If auto-ban fails, alert staff
                    const { logEvent } = require('./utils/logger');
                    const logChannel = guild.channels.cache.get(config.log_channel);
                    if (logChannel) {
                        const embed = {
                            title: '🌍 Global Ban Alert',
                            color: 0xFF6B6B,
                            description: `User **${member.user.tag}** (${member.id}) is on global ban list but auto-ban failed.`,
                            fields: [
                                { name: 'Reason', value: banInfo.reason, inline: false },
                            ],
                            timestamp: new Date()
                        };
                        await logEvent(guild, embed, 'critical');
                    }
                }
                return;
            }
        } catch (err) {
            console.error('Global ban check error:', err);
        }
    }
    
    // Check if user already has verified role (skip verification)
    if (config?.verified_role_id) {
        try {
            const hasVerifiedRole = member.roles.cache.has(config.verified_role_id);
            if (hasVerifiedRole) {
                // Already verified, skip
                return;
            }
        } catch (e) {
            // Ignore role check errors
        }
    }

    // Send verification challenge if verification channel is configured
    if (config?.verification_channel) {
        try {
            const { sendVerificationChallenge, logVerificationAction } = require('./utils/verification');
            const success = await sendVerificationChallenge(member);
            
            if (success) {
                const verificationChannel = guild.channels.cache.get(config.verification_channel);
                if (verificationChannel) {
                    try {
                        await verificationChannel.send(`🔐 <@${member.id}> has been sent a verification code via DM. Please check your messages!`);
                    } catch (e) {
                        // Ignore channel send errors
                    }
                }
                
                await logVerificationAction(guild, member, 'challenge_sent', 'Verification code sent to user');
                return;
            }
        } catch (err) {
            console.error('Verification challenge error:', err);
        }
    }
    
    if (config && config.panic_mode) {
        try {
            await member.kick('Server is in panic mode');
            const { logEvent } = require('./utils/logger');
            const logChannel = guild.channels.cache.get(config.log_channel);
            if (logChannel) {
                const embed = {
                    title: '👻 Panic Mode: Member Kicked',
                    color: 0xFF0000,
                    description: `Automatically kicked **${member.user.tag}** because panic mode is active.`,
                    timestamp: new Date()
                };
                await logEvent(guild, embed, 'critical');
            }
            return;
        } catch (err) {
            console.error('Panic mode kick failed:', err);
        }
    }

    if (config && config.antiraid) {
        const now = Date.now();
        const interval = 60000; // 1 minute
        
        let joins = joinLog.get(guild.id) || [];
        joins = joins.filter(t => now - t < interval);
        joins.push(now);
        joinLog.set(guild.id, joins);

        if (joins.length >= config.max_joins) {
            try {
                const devMode = process.env.SPECTRE_DEV_MODE === 'true';
                const testGuilds = process.env.TEST_GUILD_IDS ? process.env.TEST_GUILD_IDS.split(',') : [];
                const isTestGuild = testGuilds.includes(guild.id);

                if (devMode && !isTestGuild) {
                    const { logEvent } = require('./utils/logger');
                    const embed = {
                        title: '🛠️ [DEV MODE] Anti-Raid Triggered',
                        color: 0xFFAA00,
                        description: `Mass join detected (**${joins.length}** joins). Lockdown skipped due to Dev Mode.`,
                        timestamp: new Date()
                    };
                    return await logEvent(guild, embed, 'critical');
                }

                // Enable server lockdown
                await guild.roles.everyone.setPermissions(guild.roles.everyone.permissions.remove(PermissionFlagsBits.SendMessages));
                
                const { logEvent } = require('./utils/logger');
                const logChannel = guild.channels.cache.get(config.log_channel);
                if (logChannel) {
                    const embed = {
                        title: '🚨 Anti-Raid Triggered',
                        color: 0xFF0000,
                        description: `Mass join detected (**${joins.length}** joins in 1 min). Server has been locked down.`,
                        timestamp: new Date()
                    };
                    await logEvent(guild, embed, 'critical');
                }
                
                // Reset joins to prevent repeated triggers in the same window
                joinLog.set(guild.id, []);
            } catch (err) {
                console.error('Anti-Raid lockdown failed:', err);
            }
        }
    }
});

// Anti-Spam Tracking
const messageLog = new Map();
const { getGuildConfig, invalidateGuildConfig } = require('./utils/configCache');
const { shouldDebounce } = require('./utils/debounce');

client.on('messageCreate', async message => {
    const prefix = process.env.PREFIX || config.prefix;
    if (message.author.bot || !message.guild) return;

    const { getEffectiveSetting } = require('./utils/channeloverrides');
    const { isWhitelisted, logWhitelistSkip } = require('./utils/whitelist');
    const { trackBeastAction } = require('./utils/beast');
    
    // Get cached guild config (single DB query instead of multiple)
    const guildConfig = getGuildConfig(message.guild.id);
    if (!guildConfig) return;

    // Check if heavy AI checks should be debounced
    const aiDebounceKey = `${message.guild.id}-${message.author.id}-aifilter`;
    const shouldSkipAI = shouldDebounce(aiDebounceKey);
    
    // Anti-Mention-Everyone
    const antiEveryoneEnabled = getEffectiveSetting(message.guild, message.channel, 'anti_everyone');
    if (antiEveryoneEnabled && (message.content.includes('@everyone') || message.content.includes('@here'))) {
        if (isWhitelisted(message.member, 'anti-mention-everyone')) {
            await trackBeastAction(message.guild, message.author, 'everyone');
        } else {
            await message.delete();
            const { handleOffense } = require('./utils/pipeline');
            await handleOffense(message.member, 'Unauthorized mention of @everyone/@here');
            return;
        }
    }
    
    if (isWhitelisted(message.member, 'antispam')) {
        // Skip antispam checks but continue to filter checks
        if (messageLog.get(`${message.guild.id}-${message.author.id}`)) {
            const key = `${message.guild.id}-${message.author.id}`;
            const now = Date.now();
            const intervalMs = guildConfig.interval * 1000;
            let userLog = messageLog.get(key) || [];
            userLog = userLog.filter(t => now - t < intervalMs);
            if (userLog.length > guildConfig.max_messages) {
                await logWhitelistSkip(message.guild, message.author, 'antispam');
                messageLog.set(key, []);
            }
        }
    } else {
        const antispamEnabled = getEffectiveSetting(message.guild, message.channel, 'antispam');
        if (guildConfig && guildConfig.antispam && antispamEnabled) {
            const key = `${message.guild.id}-${message.author.id}`;
            const now = Date.now();
            const intervalMs = guildConfig.interval * 1000;
            
            let userLog = messageLog.get(key) || [];
            userLog = userLog.filter(timestamp => now - timestamp < intervalMs);
            userLog.push(now);
            messageLog.set(key, userLog);

            if (userLog.length > guildConfig.max_messages) {
                try {
                    await message.delete();
                    const { handleOffense } = require('./utils/pipeline');
                    await handleOffense(message.member, 'Spam detected (Pipeline Escalation)');
                } catch (err) {
                    console.error('Anti-Spam Error:', err);
                }
                return;
            }
        }
    }

    // Word & Regex Filter Check (before other filters)
    const { checkFilters, logFilterAction } = require('./utils/filterchecker');
    const filterMatch = await checkFilters(message);
    if (filterMatch) {
        try {
            let actionTaken = 'WARN';
            
            if (filterMatch.action === 'delete') {
                await message.delete();
                actionTaken = 'MESSAGE DELETED';
            } else if (filterMatch.action === 'mute') {
                await message.delete();
                await message.member.timeout(10 * 60 * 1000, `Word filter: ${filterMatch.pattern}`);
                actionTaken = 'MUTED (10m)';
            } else if (filterMatch.action === 'warn') {
                await message.delete();
                const { handleOffense } = require('./utils/pipeline');
                await handleOffense(message.member, `Word filter matched: ${filterMatch.pattern}`);
                actionTaken = 'PIPELINE ESCALATION';
            }
            
            await logFilterAction(message.guild, message, filterMatch, actionTaken);
            return;
        } catch (err) {
            console.error('Word Filter Error:', err);
        }
    }

    // Anti-Link/Invite Logic (with channel override support)
    if (isWhitelisted(message.member, 'antilink')) {
        const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
        if (inviteRegex.test(message.content)) {
            await logWhitelistSkip(message.guild, message.author, 'antilink');
        }
    } else {
        const antilinkEnabled = getEffectiveSetting(message.guild, message.channel, 'antilink');
        if (guildConfig && guildConfig.antilink && antilinkEnabled) {
            const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
            const urlRegex = /(https?:\/\/[^\s]+)/gi;
            
            const hasInvite = inviteRegex.test(message.content);
            const urls = message.content.match(urlRegex);

            if (hasInvite || urls) {
                let shouldDelete = hasInvite;
                
                if (urls && !shouldDelete) {
                    const whitelist = db.prepare('SELECT domain FROM whitelist WHERE guild_id = ?').all(message.guild.id).map(r => r.domain.toLowerCase());
                    for (const url of urls) {
                        try {
                            const domain = new URL(url).hostname.toLowerCase().replace('www.', '');
                            if (!whitelist.includes(domain)) {
                                shouldDelete = true;
                                break;
                            }
                        } catch (e) {
                            shouldDelete = true;
                            break;
                        }
                    }
                }

                if (shouldDelete) {
                    try {
                        await message.delete();
                        const { handleOffense } = require('./utils/pipeline');
                        await handleOffense(message.member, 'Unauthorized link (Pipeline Escalation)');
                        return;
                    } catch (err) {
                        console.error('Anti-Link Error:', err);
                    }
                }
            }
        }
    }

    // AI Filtering logic (token leak detection - always checked)
    const tokenRegex = /[a-zA-Z0-9_-]{24,28}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27,38}/;
    if (tokenRegex.test(message.content)) {
        if (guildConfig?.log_channel) {
            const channel = message.guild.channels.cache.get(guildConfig.log_channel);
            if (channel) {
                channel.send({
                    embeds: [{
                        title: '⚠️ Potential Token Leak',
                        color: 0xFFAA00,
                        description: `User **${message.author.tag}** sent a message that appears to contain a Discord bot token.`,
                        timestamp: new Date()
                    }]
                });
            }
        }
    }

    // OpenAI Moderation Filter (debounced to avoid API spam on rapid messages)
    const aifilterEnabled = getEffectiveSetting(message.guild, message.channel, 'aifilter');
    
    if (aifilterEnabled && !shouldSkipAI) {
        if (isWhitelisted(message.member, 'aifilter')) {
            // Note: We don't log AI filter whitelist bypass to avoid OpenAI API costs/latency for whitelisted users
        } else if (guildConfig && process.env.OPENAI_API_KEY) {
            if (guildConfig.debug) console.log(`[DEBUG] [${message.guild.id}] AI Moderation check for message from ${message.author.tag}`);
            
            // Premium Check for AI
            const premium = db.prepare('SELECT expires_at FROM premium_guilds WHERE guild_id = ?').get(message.guild.id);
            const isPremium = premium && (new Date(premium.expires_at) > new Date());
            
            if (isPremium) {
                try {
                    const { moderateMessage, logModerationAction } = require('./utils/moderation');
                    const aiMode = guildConfig.ai_mode || 'normal';
                    
                    const result = await moderateMessage(message.content, aiMode);
                    
                    if (result && result.isFlagged) {
                        const { handleOffense } = require('./utils/pipeline');
                        const categoryList = result.categories.map(c => c.category).join(', ');
                        await handleOffense(message.member, `Content Moderation (${categoryList})`);
                        
                        // Log the moderation action
                        await logModerationAction(message.guild, message, result, 'Pipeline Escalation Initiated');
                        return;
                    }
                } catch (err) {
                    console.error('Moderation Filter Error:', err);
                }
            }
        }
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

    // Rate Limit Check (5 commands per 10 seconds)
    const { checkRateLimit } = require('./utils/ratelimit');
    const { getEmoji } = require('./utils/emojis');
    const rateLimitResult = checkRateLimit(message.author.id, message.guild.id, message.member);
    
    if (!rateLimitResult.allowed) {
        return message.reply(`${getEmoji('WARN')} You're sending commands too fast. Please slow down.`);
    }

    // Fetch language for strings
    const langConfig = db.prepare('SELECT language FROM guild_config WHERE guild_id = ?').get(message.guild.id);
    const lang = langConfig?.language || 'en';
    const strings = require('./utils/strings');
    const langStrings = strings[lang] || strings.en;

    // Cooldown Logic
    const cooldownCommands = ['panic', 'spectrelockdown', 'antinuke', 'antiraid', 'backup', 'restore', 'exportlogs'];
    if (cooldownCommands.includes(command.name)) {
        const cooldownKey = `${message.author.id}-${command.name}`;
        const now = Date.now();
        const cooldownTime = 5000; // 5 seconds

        if (cooldowns.has(cooldownKey)) {
            const expirationTime = cooldowns.get(cooldownKey) + cooldownTime;
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return message.reply(`⏳ Please wait **${timeLeft}s** before using the \`${command.name}\` command again.`);
            }
        }
        cooldowns.set(cooldownKey, now);
        setTimeout(() => cooldowns.delete(cooldownKey), cooldownTime);
    }

    // Permission Check Helper
    const hasPermission = (member, guild) => {
        if (member.id === guild.ownerId) return true;
        if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
        
        const config = db.prepare('SELECT staff_role_id FROM guild_config WHERE guild_id = ?').get(guild.id);
        if (config?.staff_role_id && member.roles.cache.has(config.staff_role_id)) return true;
        
        return false;
    };

    // Standard high-risk command security bypass for standard check
    const highRiskCommands = ['ban', 'kick', 'panic', 'antinuke', 'antiraid', 'spectrelockdown', 'setstaffrole', 'setlog', 'aifilter', 'antispam', 'antilink', 'case', 'mute', 'unmute', 'unban', 'warn', 'lock', 'unlock', 'serverlock', 'slowmode'];
    
    if (highRiskCommands.includes(command.name)) {
        if (!hasPermission(message.member, message.guild)) {
            return message.reply(langStrings.no_perm);
        }
    }

    // Premium Check
    if (command.premiumOnly) {
        const premium = db.prepare('SELECT expires_at FROM premium_guilds WHERE guild_id = ?').get(message.guild.id);
        const isPremium = premium && (new Date(premium.expires_at) > new Date());
        if (!isPremium) {
            return message.reply(`${getEmoji('PREMIUM')} This command is restricted to **Spectre Premium** servers.`);
        }
    }

    try {
        const startTime = Date.now();
        await command.execute(message, args, client);
        const duration = Date.now() - startTime;
        
        const guildConfig = db.prepare('SELECT debug FROM guild_config WHERE guild_id = ?').get(message.guild.id);
        if (guildConfig?.debug) {
            console.log(`[DEBUG] Guild: ${message.guild.id} | Command: s!${command.name} | Duration: ${duration}ms`);
        }
        
        if (duration > 500) {
            const { recordSlowCommand } = require('./utils/metrics');
            recordSlowCommand(command.name, duration);
        }

        // Track usage
        db.prepare('INSERT INTO command_usage (guild_id, command_name, uses, last_used_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(guild_id, command_name) DO UPDATE SET uses = uses + 1, last_used_at = CURRENT_TIMESTAMP').run(message.guild.id, command.name);
    } catch (error) {
        console.error('Command Execution Error:', error);
        message.reply({
            embeds: [{
                title: langStrings.error_title,
                color: 0xFF0000,
                description: langStrings.error_desc,
                timestamp: new Date()
            }]
        });
    }
});

// Slash Command Handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const slashCommand = client.slashCommands.get(interaction.commandName);
    if (!slashCommand) return;

    try {
        await slashCommand.execute(interaction);
    } catch (error) {
        console.error(`Error executing slash command ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ An error occurred while executing this command.', ephemeral: true }).catch(() => {});
        } else {
            await interaction.reply({ content: '❌ An error occurred while executing this command.', ephemeral: true }).catch(() => {});
        }
    }
});

// Process-level error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    broadcastToAllLogs('Unhandled Rejection', reason?.message || 'Unknown error');
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    broadcastToAllLogs('Uncaught Exception', err?.message || 'Unknown error');
});

// Safety & Masking Helpers
function maskToken(str) {
    if (!str || typeof str !== 'string') return 'N/A';
    if (str.length < 10) return '***';
    return `${str.substring(0, 4)}***${str.substring(str.length - 4)}`;
}

async function broadcastToAllLogs(title, errorMessage) {
    try {
        const { logEvent } = require('./utils/logger');
        const guilds = client.guilds.cache;
        
        // Mask any potential secrets in the error message
        const maskedError = errorMessage.replace(/[a-zA-Z0-9_-]{20,}/g, (match) => maskToken(match));

        for (const [id, guild] of guilds) {
            try {
                const embed = {
                    title: `⚠️ Spectre System Error: ${title}`,
                    color: 0xFF0000,
                    description: `A system error occurred: \`${maskedError}\`\n\nRestart Spectre or contact the bot owner if this repeats.`,
                    timestamp: new Date()
                };
                await logEvent(guild, embed, 'critical');
            } catch (e) {
                // Silently fail if logging to a specific guild fails
            }
        }
    } catch (e) {
        console.error('Failed to broadcast error logs:', e);
    }
}

// Startup Secret Validation
const REQUIRED_SECRETS = ['DISCORD_TOKEN', 'BOT_OWNER_ID'];
const missingSecrets = REQUIRED_SECRETS.filter(secret => !process.env[secret]);

if (missingSecrets.length > 0) {
    console.error(`[CRITICAL] Missing required environment variables: ${missingSecrets.join(', ')}`);
    console.error('The bot cannot start without these. Please check your environment configuration.');
    process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
    console.warn('[WARNING] OPENAI_API_KEY is missing. AI moderation features will be disabled.');
}

// Main login with error handling
const start = async () => {
    try {
        const token = process.env.DISCORD_TOKEN;
        await client.login(token);
    } catch (err) {
        console.error('Failed to login to Discord:', err.message);
        process.exit(1);
    }
};

start();