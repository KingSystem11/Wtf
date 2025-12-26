const slowCommands = [];
const MAX_SLOW_LOGS = 20;

module.exports = {
    recordSlowCommand(name, duration) {
        slowCommands.unshift({
            name,
            duration,
            timestamp: new Date()
        });
        
        if (slowCommands.length > MAX_SLOW_LOGS) {
            slowCommands.pop();
        }
        
        console.warn(`[Profiling] Command s!${name} took ${duration}ms`);
    },
    
    getSlowCommands() {
        return slowCommands;
    }
};
