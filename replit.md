# Spectre Discord Bot

## Overview

Spectre is a Discord moderation bot built with discord.js v14. It provides comprehensive server moderation including:
- Manual word & regex-based filters (delete/warn/mute actions)
- OpenAI moderation endpoint with configurable thresholds
- Anti-raid, anti-spam, anti-nuke, anti-link protections
- Moderation commands (ban, kick, mute, warn, unban)
- Punishment pipeline escalation system
- Per-guild logging and configuration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Command Handler Pattern
- **Problem**: Need a scalable way to add and manage bot commands
- **Solution**: File-based command loading from the `/commands` directory. Each command is a separate module exporting a name, description, and execute function
- **Pros**: Easy to add new commands, separation of concerns, maintainable
- **Cons**: No built-in command categories or subcommands

### Prefix-Based Commands
- **Problem**: Users need a way to interact with the bot
- **Solution**: Traditional prefix system (`s!`) with configurable prefix via environment variable or config.json
- **Alternatives**: Slash commands (Discord's newer approach)
- **Pros**: Simple implementation, familiar to users
- **Cons**: Less discoverable than slash commands, no autocomplete

### Database Design
- **Tables**:
  - `guild_config`: Per-guild settings (prefix, filters, modes, logging)
  - `word_filters`: Custom word/regex patterns with actions (delete/warn/mute)
  - `cases`: Moderation action log
  - `antinuke_cases`, `ai_logs`, `premium_guilds`: Feature-specific tracking
- **Solution**: SQLite via better-sqlite3 for synchronous, file-based storage
- **Pros**: Zero configuration, no external database needed, fast for small-medium workloads
- **Cons**: Not suitable for large-scale bots across many servers, single-file storage

### Content Moderation System
- **Word/Regex Filters**: Exact word match (case-insensitive) or regex patterns
  - Actions: delete message, warn (pipeline), or mute (10m)
  - Managed via `s!filter add/remove/list` commands
  - Checked before other filters for early interception
  
- **OpenAI Moderation Endpoint**: Official moderation API for content classification
  - Categories: violence, hate, harassment, self-harm
  - **Configurable Thresholds** (in `utils/moderation.js`):
    - violence: 0.5, hate: 0.5, harassment: 0.5, self_harm: 0.3
  - **AI Mode Multipliers** (adjust thresholds):
    - lenient (1.3x), normal (1.0x), aggressive (0.7x)
  - Premium feature (checked per guild)
  - No raw API responses logged; only risk categories and scores stored

### Permission System
- **Problem**: Only authorized users should run moderation commands
- **Solution**: Discord.js permission flags checked at command execution (e.g., `BanMembers`, `KickMembers`, `ModerateMembers`)
- **Pros**: Uses Discord's native permission system
- **Cons**: No custom permission levels or role-based overrides

## External Dependencies

### Discord.js v14
- Core library for Discord API interaction
- Requires `DISCORD_TOKEN` environment variable (bot token from Discord Developer Portal)
- Uses Gateway Intents: Guilds, GuildMessages, MessageContent

### better-sqlite3
- SQLite database driver for Node.js
- Database file stored at `./data/spectre.db`
- Synchronous API for simpler code flow

### Configuration
- `config.json`: Stores default prefix and embed colors
- Environment variable `PREFIX` can override the default prefix
- Environment variable `DISCORD_TOKEN` required for bot authentication
- Environment variable `OPENAI_API_KEY` required for moderation & AI features

## Localization System

### Implementation Details
- **Central File**: `utils/strings.js` - Contains all user-facing strings in English and Hindi (plus Spanish/Russian/German for extensibility)
- **Helper Module**: `utils/localization.js` exports `getLocalizedString(guildId, key, replacements)`
  - Fetches guild's language setting from `guild_config.language`
  - Supports template placeholders: `{user}`, `{count}`, `{type}`, `{category}`, etc.
  - Fallback to English if translation missing
  - No database schema changes required
  
### Supported Languages
- **en** - English (default)
- **hi** - Hindi (मुख्य भाषा)
- **sp** - Spanish (for extensibility)
- **ru** - Russian (for extensibility)
- **ge** - German (for extensibility)

### Security Message Localization
All user-facing security events now support multi-language logging:
- **Anti-Spam**: `antispam_action`, `antispam_log_title`, `antispam_log_desc`
- **Anti-Link**: `antilink_action`, `antilink_log_title`, `antilink_log_desc`
- **Anti-@everyone**: `antieveryone_action`, `antieveryone_log_title`, `antieveryone_log_desc`
- **Word Filters**: `wordfilter_action`, `wordfilter_log_title`, `wordfilter_log_desc`
- **AI Filter**: `aifilter_action`, `aifilter_log_title`, `aifilter_log_desc`
- **Beast Mode**: `beast_log_title`, `beast_log_desc`, `beast_perms_removed`
- **Whitelist**: `whitelist_updated`, `whitelist_modules`, `whitelist_cancelled`, `whitelist_expired`
- **Token Leak**: `token_leak_title`, `token_leak_desc`
- **Global Ban**: `globalban_log_title`, `globalban_log_desc`, `globalban_alert`
- **Verification**: `verify_code_sent`

### Usage Example
```javascript
const { getLocalizedString } = require('./utils/localization');

// Single string with replacements
const reason = getLocalizedString(guildId, 'antispam_action');
const logMsg = getLocalizedString(guildId, 'antispam_log_desc', {
    user: 'UserName',
    count: 5,
    interval: 10
});

// Multiple strings at once
const { getLocalizedStrings } = require('./utils/localization');
const strings = getLocalizedStrings(guildId, ['help_title', 'error_desc']);
```

## Recent Changes (Dec 26, 2025)

### Added Features
1. **OpenAI Moderation Integration** (`utils/moderation.js`)
   - Replaced chat-based AI filter with official moderation endpoint
   - Configurable thresholds for 4 risk categories
   - AI mode multipliers (lenient/normal/aggressive) for threshold adjustment
   - Logs only category + score, not raw responses

2. **Word & Regex Filters** (`commands/filter.js`, `utils/filterchecker.js`)
   - `s!filter add <word or regex> <action>` - Add filter
   - `s!filter remove <id>` - Remove by ID
   - `s!filter list` - Show all filters for guild
   - Auto-detects regex patterns and validates syntax
   - Actions: delete, warn, mute
   - Executed before other filters for priority filtering

3. **Lightweight CAPTCHA Verification** (`commands/verify.js`, `commands/verifysetup.js`, `utils/verification.js`)
   - `s!verifysetup #channel` - Set verification channel
   - When users join: bot sends random 5-6 char code via DM
   - User submits code with `s!verify <code>`
   - On success: assigns configured Verified role
   - Attempts tracked; max 3 attempts per code, 5-minute expiry
   - Uses existing `verified_role_id` from guild config
   - All interactions logged to log channel

4. **Security Presets** (`commands/preset.js`, `utils/presets.js`)
   - `s!preset` - Shows all available presets
   - `s!preset <soft|balanced|max>` - Apply preset
   - **Soft**: Antispam only + lenient AI (beginner)
   - **Balanced**: Full protection with normal AI mode (recommended)
   - **Max**: Everything enabled + aggressive AI mode
   - Shows summary embed of changes
   - Respects premium status (disables AI features if not premium)
   - All settings applied to database in one transaction

5. **Per-Channel Overrides** (`commands/chanset.js`, `utils/channeloverrides.js`)
   - `s!chanset <#channel> <antispam|antilink|aifilter> <on|off>` - Set channel override
   - `s!chanset reset <#channel>` - Remove all overrides for channel
   - Filters check channel override first, then fall back to guild-wide setting
   - Useful for moderation channels, NSFW channels, dev channels, etc.
   - Applied in real-time during message processing

6. **Global Banlist** (`commands/globalban.js`, `utils/globalban.js`)
   - `s!globalban on/off` - Enable/disable global ban checking (guild owner only)
   - `s!globalban add @user <reason>` - Add to global ban list (guild owner + bot owner only)
   - `s!globalban remove @user` - Remove from global ban list
   - `s!globalban info @user` - Check global ban status
   - When enabled, globally banned users auto-ban on join (or alert staff if ban fails)
   - All actions logged to log channel
   - Optional per-guild; respects permission restrictions

7. **Incident Report Generator** (`commands/incident.js`, `utils/incident.js`)
   - `s!incident <@user or userId>` - Generate compact incident report (Moderators only)
   - Gathers from existing tables: cases, ai_logs, antinuke_cases, verification_codes
   - Shows last 5-10 infractions per category with timestamps
   - Color-coded embed (green = safe, orange = minor, red = serious)
   - Useful for staff to quickly review problematic members
   - No new tables - reads from existing logging

8. **Status Summary** (`commands/jsonstatus.js`, `utils/status.js`)
   - `s!jsonstatus` - Returns JSON status snapshot (Guild owner only)
   - Guild info: ID, name, member count, owner
   - Security settings: all protection flags, AI mode
   - Counts: moderation cases, AI logs, anti-nuke events, word filters
   - Premium status and expiration date
   - Compact format fits in single Discord message
   - Foundation for future dashboard integration

9. **Command Documentation System**
   - Central `emoji.json` - All emojis in one place for consistency
   - `utils/emojis.js` - Helper to load/access emojis via `getEmoji(key)`
   - `s!describe <command>` - Shows detailed command info (name, aliases, category, usage, premium status)
   - `s!checkhelp` - Owner-only verification tool to find commands missing from help menu
   - Both commands respect permission checks (hidden from non-staff)

10. **Per-User Command Rate Limiter**
   - Default: 5 commands per 10 seconds per user (in-memory, no DB)
   - Exempt: Guild owner, ADMINISTRATOR permission, BOT_OWNER_ID env
   - Exceeding limit: sends warning with emoji from emoji.json
   - Integrated at command dispatch point (single location)
   - Prevents spam/abuse of command system

11. **Centralized Permission System**
   - Utility: `utils/permissions.js` exports `canUseCommand()`, `isStaff()`, `isOwner()`
   - `canUseCommand(member, command, guildConfig)` - checks command-level flags (ownerOnly, devOnly, staffOnly)
   - `isStaff(member, guildConfig)` - checks guild owner, ADMINISTRATOR, and staff_role_id
   - Used in: help.js, describe.js (commands filter based on user permissions)
   - Prevents duplicate permission logic across codebase
   - Single source of truth for permission checks

### Database Changes
- Added `verification_codes` table - tracks codes, attempts, expiry, verification status
- Added `verification_channel` column to `guild_config` table
- Added `word_filters` table for word/regex patterns
- Added `channel_overrides` table - per-channel filter settings (antispam, antilink, aifilter)
- Added `global_bans` table - shared banlist across guilds (user_id, reason, added_by_guild_id)
- Added `globalban_enabled` column to `guild_config` table