// Centralized permission checking
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    /**
     * Check if a member can use a command
     * @param {GuildMember} member - The member to check
     * @param {Object} command - The command object
     * @param {Object} guildConfig - Guild config from database
     * @returns {boolean} - Whether the member can use the command
     */
    canUseCommand(member, command, guildConfig) {
        // Check global bot-owner/dev only commands first (Never allowed for extra owners)
        if (command.ownerOnly || command.devOnly) {
            const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
            return member.id === BOT_OWNER_ID;
        }

        // Guild level "High Risk" commands
        // Allowed for: Guild Owner OR Extra Owners OR Administrators
        if (command.highRisk) {
            if (member.id === member.guild.ownerId) return true;
            if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
            
            const db = require('./db');
            const extraOwner = db.query('SELECT user_id FROM extra_owners WHERE guild_id = ? AND user_id = ?', [member.guild.id, member.id]);
            if (extraOwner) return true;

            // If it's high risk and not owner/admin/extra-owner, deny even if they have staff role
            return false;
        }

        // Check staff-level commands
        if (command.staffOnly) {
            return this.isStaff(member, guildConfig);
        }

        // All other commands are available to everyone
        return true;
    },

    /**
     * Check if a member is staff (owner, admin, or has staff role)
     * @param {GuildMember} member - The member to check
     * @param {Object} guildConfig - Guild config from database
     * @returns {boolean} - Whether the member is staff
     */
    isStaff(member, guildConfig) {
        if (!member || !member.guild) return false;

        // Guild owner
        if (member.id === member.guild.ownerId) return true;

        // Administrator permission
        if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

        // Staff role (if configured)
        if (guildConfig?.staff_role_id && member.roles.cache.has(guildConfig.staff_role_id)) {
            return true;
        }

        return false;
    },

    /**
     * Check if a member is owner (guild owner or bot owner)
     * @param {GuildMember} member - The member to check
     * @returns {boolean} - Whether the member is owner
     */
    isOwner(member) {
        const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
        return member.id === member.guild.ownerId || member.id === BOT_OWNER_ID;
    },
};
