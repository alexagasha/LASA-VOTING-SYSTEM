const express = require("express");
const cors = require("cors");
const db = require("./db/db");
const authRoutes = require("./routes/auth");
const voteRoutes = require("./routes/vote");
const resultRoutes = require("./routes/results");
const votersData = require("./voters");

const app = express();

app.use(cors());
app.use(express.json());

/**
 * =========================
 * DATABASE INITIALIZATION
 * =========================
 */
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS voters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voter_id TEXT UNIQUE,
            name TEXT,
            email TEXT UNIQUE,
            pin TEXT,
            voted INTEGER DEFAULT 0,
            role TEXT DEFAULT 'voter'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            party TEXT,
            votes INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voter_id TEXT,
            candidate_id INTEGER,
            vote_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Seed voters
    const insertVoter = db.prepare(`
        INSERT OR IGNORE INTO voters 
        (voter_id, name, email, pin, voted, role)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    votersData.forEach(voter => {
        insertVoter.run(
            voter.id,
            voter.name,
            voter.email,
            voter.pin,
            voter.voted ? 1 : 0,
            voter.role
        );
    });

    insertVoter.finalize();

    console.log("Database initialized and voters seeded.");
});

/**
 * =========================
 * ROUTES
 * =========================
 */
app.get("/", (req, res) => {
    res.send("LASA Voting API Running");
});

// Existing route files
app.use("/api/auth",    authRoutes);
app.use("/api/vote",    voteRoutes);
app.use("/api/results", resultRoutes);

/**
 * GET /api/candidates
 * ─────────────────────────────────────────────────────
 * Returns all candidates ordered by votes descending.
 * Same query as /api/results but mounted at the path
 * the React UI originally expected.
 */
app.get("/api/candidates", (req, res) => {
    db.all(
        "SELECT * FROM candidates ORDER BY votes DESC",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

/**
 * GET /api/voters
 * ─────────────────────────────────────────────────────
 * Returns all voters (PIN excluded for security).
 * Used by admin views or diagnostics only — never
 * send raw voter data to the client in production.
 */
app.get("/api/voters", (req, res) => {
    db.all(
        "SELECT id, voter_id, name, email, voted, role FROM voters",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

/**
 * GET /api/voters/count
 * ─────────────────────────────────────────────────────
 * Returns summary stats: total voters, votes cast, remaining.
 */
app.get("/api/voters/count", (req, res) => {
    db.get(
        `SELECT 
            COUNT(*) AS total,
            SUM(voted) AS voted,
            COUNT(*) - SUM(voted) AS remaining
         FROM voters`,
        [],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(row);
        }
    );
});

/**
 * =========================
 * START SERVER
 * =========================
 */
app.listen(5000, () => {
    console.log("Server running on port 5000");
});

app.use("/api/auth", authRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/results", resultRoutes);

/**
 * =========================
 * START SERVER
 * =========================
 */
app.listen(5000, () => {
    console.log("Server running on port 5000");
});