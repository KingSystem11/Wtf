/**
 * Debounce check: skip duplicate heavy checks within 250ms
 * Used to avoid processing multiple events from same user/channel in rapid succession
 */

const debounceMap = new Map();
const DEBOUNCE_WINDOW = 250; // ms

module.exports = {
    /**
     * Check if event should be debounced
     * @param {string} key - Unique key (e.g., "guildId-userId-check")
     * @returns {boolean} true if should skip (debounced), false if should process
     */
    shouldDebounce(key) {
        const now = Date.now();
        const lastTime = debounceMap.get(key);

        if (!lastTime || (now - lastTime) >= DEBOUNCE_WINDOW) {
            // Update the time for this key
            debounceMap.set(key, now);
            return false; // Process this event
        }

        // Too soon, skip it
        return true;
    },

    /**
     * Reset debounce timer for a key
     * @param {string} key - Unique key
     */
    reset(key) {
        debounceMap.delete(key);
    },

    /**
     * Get debounce stats (for monitoring)
     */
    getStats() {
        return {
            trackedKeys: debounceMap.size,
            keys: Array.from(debounceMap.keys())
        };
    }
};
