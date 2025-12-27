const { Client, GatewayIntentBits, Collection, PermissionFlagsBits, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const dbWrapper = require('./utils/db');
const config = require('./configLoader');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Database Migration System
function runMigrations() {
    console.log('[DB] Running database migrations...');
    try {
        const tableInfo = db.prepare("PRAGMA table_info(guild_config)").all();
        const columns = tableInfo.map(info => info.name);

        const requiredColumns = [
            { name: 'staff_role_id', type: 'TEXT DEFAULT NULL' },
            { name: 'debug', type: 'INTEGER DEFAULT 0' },
            { name: 'beast_enabled', type: 'INTEGER DEFAULT 0' },
            { name: 'beast_limit_ban', type: 'INTEGER DEFAULT 3' },
            { name: 'beast_limit_kick', type: 'INTEGER DEFAULT 5' },
            { name: 'beast_limit_everyone', type: 'INTEGER DEFAULT 2' },
            { name: 'verification_channel', type: 'TEXT DEFAULT NULL' },
            { name: 'globalban_enabled', type: 'INTEGER DEFAULT 0' },
            { name: 'anti_everyone', type: 'INTEGER DEFAULT 0' },
            { name: 'language', type: 'TEXT DEFAULT "en"' },
            { name: 'verified_role_id', type: 'TEXT DEFAULT NULL' },
            { name: 'ai_mode', type: 'TEXT DEFAULT "normal"' },
            { name: 'punishment_pipeline', type: 'TEXT DEFAULT "warn,mute10,mute60,kick,ban"' },
            { name: 'log_level', type: 'TEXT DEFAULT "normal"' },
            { name: 'panic_mode', type: 'INTEGER DEFAULT 0' },
            { name: 'prefix', type: 'TEXT DEFAULT "s!"' },
            { name: 'log_channel', type: 'TEXT DEFAULT NULL' },
            { name: 'antinuke', type: 'INTEGER DEFAULT 0' },
            { name: 'aifilter', type: 'INTEGER DEFAULT 0' },
            { name: 'antispam', type: 'INTEGER DEFAULT 0' },
            { name: 'max_messages', type: 'INTEGER DEFAULT 8' },
            { name: 'interval', type: 'INTEGER DEFAULT 5' },
            { name: 'antilink', type: 'INTEGER DEFAULT 0' },
            { name: 'antiraid', type: 'INTEGER DEFAULT 0' },
            { name: 'max_joins', type: 'INTEGER DEFAULT 10' },
            { name: 'antinuke_limit', type: 'INTEGER DEFAULT 3' },
            { name: 'antinuke_window', type: 'INTEGER DEFAULT 30' }
        ];

        let addedCount = 0;
        for (const col of requiredColumns) {
            if (!columns.includes(col.name)) {
                try {
                    db.prepare(`ALTER TABLE guild_config ADD COLUMN ${col.name} ${col.type}`).run();
                    console.log(`[DB] Added missing column: ${col.name}`);
                    addedCount++;
                } catch (alterErr) {
                    console.error(`[DB] Failed to add column ${col.name}:`, alterErr.message);
                }
            }
        }

        console.log('[DB] DB migration OK');
    } catch (err) {
        console.error('[DB] Migration failed:', err);
    }
}

// Database Setup
const db = new Database('./data/spectre.db');
db.prepare('CREATE TABLE IF NOT EXISTS guild_config (guild_id TEXT PRIMARY KEY)').run();
runMigrations();

// Other Tables
db.prepare('CREATE TABLE IF NOT EXISTS premium_guilds (guild_id TEXT PRIMARY KEY, activated_by TEXT, activated_at DATETIME DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME)').run();
db.prepare('CREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, data_json TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run();
db.prepare('CREATE TABLE IF NOT EXISTS antinuke_cases (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, executor_id TEXT, type TEXT, count INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run();
db.prepare('CREATE TABLE IF NOT EXISTS whitelist (guild_id TEXT, domain TEXT, PRIMARY KEY(guild_id, domain))').run();
db.prepare('CREATE TABLE IF NOT EXISTS channel_overrides (guild_id TEXT, channel_id TEXT, antispam INTEGER, antilink INTEGER, aifilter INTEGER, PRIMARY KEY(guild_id, channel_id))').run();
db.prepare('CREATE TABLE IF NOT EXISTS global_bans (user_id TEXT PRIMARY KEY, reason TEXT, added_by_guild_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run();
db.prepare('CREATE TABLE IF NOT EXISTS word_filters (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, pattern TEXT, type TEXT, action TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run();
db.prepare('CREATE TABLE IF NOT EXISTS verification_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, user_id TEXT, code TEXT, attempts INTEGER DEFAULT 0, verified INTEGER DEFAULT 0, failed INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME, verified_at DATETIME)').run();
db.prepare('CREATE TABLE IF NOT EXISTS ai_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, user_id TEXT, content TEXT, risk_score TEXT, action TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run();
db.prepare('CREATE TABLE IF NOT EXISTS cases (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, user_id TEXT, moderator_id TEXT, action TEXT, reason TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP)').run();
db.prepare('CREATE TABLE IF NOT EXISTS command_usage (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, command_name TEXT, uses INTEGER DEFAULT 0, last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(guild_id, command_name))').run();

// Command Collections
client.commands = new Collection();
client.slashCommands = new Collection();

// Load Prefix Commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    } catch (err) {
        console.error(`Failed to load command ${file}:`, err);
    }
}

// Load Slash Commands
const slashFiles = fs.readdirSync('./slashcommands').filter(file => file.endsWith('.js'));
for (const file of slashFiles) {
    try {
        const command = require(`./slashcommands/${file}`);
        client.slashCommands.set(command.data.name, command);
    } catch (err) {
        console.error(`Failed to load slash command ${file}:`, err);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Register slash commands
    const slashData = Array.from(client.slashCommands.values()).map(cmd => cmd.data.toJSON());
    if (slashData.length > 0) {
        try {
            await client.application.commands.set(slashData);
            console.log(`[SlashCommands] Registered ${slashData.length} global slash commands`);
        } catch (err) {
            console.error('[SlashCommands] Registration failed:', err);
        }
    }

    console.log(`[LOADER] Loaded ${client.commands.size} prefix commands.`);
    console.log(`[LOADER] Loaded ${client.slashCommands.size} slash commands.`);
});

// Single Message Handler
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const prefix = config.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Error executing prefix command ${commandName}:`, error);
        message.reply('❌ An error occurred while executing this command.').catch(() => {});
    }
});

// Single Interaction Handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing slash command ${interaction.commandName}:`, error);
        const content = '❌ An error occurred while executing this command.';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, ephemeral: true }).catch(() => {});
        } else {
            await interaction.reply({ content, ephemeral: true }).catch(() => {});
        }
    }
});

// Process-level error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

client.login(config.token).catch(err => {
    console.error('[CRITICAL] Login failed:', err);
});
