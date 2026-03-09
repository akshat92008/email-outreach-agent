const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'outreach.db');
const db = new Database(dbPath);

// Initialize the database schema
db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        niche TEXT,
        city TEXT,
        country TEXT,
        phone TEXT,
        email TEXT,
        facebook TEXT,
        instagram TEXT,
        website_status TEXT DEFAULT 'No',
        rating REAL,
        reviews INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        contacted_status TEXT DEFAULT 'pending',
        outreach_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log('Database initialized at:', dbPath);

module.exports = db;
