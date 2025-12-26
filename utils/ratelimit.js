// Per-user command rate limiter (in-memory)
// Default: 5 commands per 10 seconds

const MAX_COMMANDS = 5;
const WINDOW_MS = 10000; // 10 seconds

const userCommandLog = new Map(); // userId -> array of timestamps

module.exports = {
    checkRateLimit(userId, guildId, member) {
        const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
        
        // Exempt guild owner, admins, and bot owner
        if (member && (userId === member.guild?.ownerId || 
                      member.permissions?.has('Administrator') ||
                      userId === BOT_OWNER_ID)) {
            return { allowed: true, exempt: true };
        }

        const now = Date.now();
        const key = userId;
        
        let timestamps = userCommandLog.get(key) || [];
        
        // Remove old timestamps outside the window
        timestamps = timestamps.filter(t => now - t < WINDOW_MS);
        
        // Check if over limit
        if (timestamps.length >= MAX_COMMANDS) {
            return { allowed: false, exempt: false };
        }
        
        // Add new timestamp
        timestamps.push(now);
        userCommandLog.set(key, timestamps);
        
        return { allowed: true, exempt: false };
    },

    cleanup() {
        // Periodically clean up old entries (call this from a timer if needed)
        const now = Date.now();
        for (const [userId, timestamps] of userCommandLog.entries()) {
            const active = timestamps.filter(t => now - t < WINDOW_MS);
            if (active.length === 0) {
                userCommandLog.delete(userId);
            } else {
                userCommandLog.set(userId, active);
            }
        }
    },
};
