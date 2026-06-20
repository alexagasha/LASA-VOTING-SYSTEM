const db = require("./db/db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS voters (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      pin TEXT,
      voted INTEGER DEFAULT 0,
      role TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      party TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_id TEXT,
      candidate_id INTEGER
    )
  `);

  console.log("Database tables created successfully");
});