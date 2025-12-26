const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDatabase() {
    if (!db) {
        try {
            const dbPath = path.join(__dirname, '../data/spectre.db');
            db = new Database(dbPath, { 
                verbose: process.env.NODE_ENV === 'development' ? console.log : null,
                fileMustExist: false
            });
            
            // Defensives and Performance
            db.pragma('journal_mode = WAL');
            db.pragma('synchronous = NORMAL');
            db.pragma('foreign_keys = ON');
            
        } catch (err) {
            console.error('[CRITICAL] Database failed to open:', err);
            throw err;
        }
    }
    return db;
}

function query(sql, params = []) {
    try {
        return getDatabase().prepare(sql).get(...params);
    } catch (err) {
        console.error(`[DB ERROR] Query: ${sql}`, err);
        throw err;
    }
}

function run(sql, params = []) {
    try {
        return getDatabase().prepare(sql).run(...params);
    } catch (err) {
        console.error(`[DB ERROR] Run: ${sql}`, err);
        throw err;
    }
}

function all(sql, params = []) {
    try {
        return getDatabase().prepare(sql).all(...params);
    } catch (err) {
        console.error(`[DB ERROR] All: ${sql}`, err);
        throw err;
    }
}

module.exports = {
    getDatabase,
    query,
    run,
    all
};
