const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * POST /api/voters/add
 * ─────────────────────────────────────────────────────
 * Admin-only: register a new voter.
 * Body: { name, email, pin }
 *
 * - voter_id is auto-generated (V001, V002, ...) by
 *   finding the highest existing numeric V### id.
 * - email must be unique (DB has a UNIQUE constraint too,
 *   but we check first so we can return a clean message).
 * - pin is normalized to a string, 4-8 chars.
 */
router.post("/add", (req, res) => {
    const { name, email, pin } = req.body;

    // ── Validation ──────────────────────────────────────
    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!pin || !String(pin).trim()) {
        return res.status(400).json({ success: false, message: "PIN is required." });
    }

    const cleanName  = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin   = String(pin).trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email address." });
    }
    if (cleanPin.length < 4 || cleanPin.length > 8) {
        return res.status(400).json({ success: false, message: "PIN must be 4-8 characters." });
    }

    // ── Check for duplicate email first (clean error message) ──
    db.get(
        "SELECT id FROM voters WHERE email = ?",
        [cleanEmail],
        (err, existing) => {
            if (err) return res.status(500).json({ success: false, message: err.message });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: "A voter with this email already exists."
                });
            }

            // ── Generate next voter_id (V001, V002, ...) ────────
            db.all(
                "SELECT voter_id FROM voters WHERE voter_id LIKE 'V%'",
                [],
                (err2, rows) => {
                    if (err2) return res.status(500).json({ success: false, message: err2.message });

                    let maxNum = 0;
                    rows.forEach((row) => {
                        const match = row.voter_id.match(/^V(\d+)$/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNum) maxNum = num;
                        }
                    });

                    const nextId = `V${String(maxNum + 1).padStart(3, "0")}`;

                    // ── Insert new voter ─────────────────────────
                    db.run(
                        `INSERT INTO voters (voter_id, name, email, pin, voted, role)
                         VALUES (?, ?, ?, ?, 0, 'voter')`,
                        [nextId, cleanName, cleanEmail, cleanPin],
                        function (err3) {
                            if (err3) {
                                return res.status(500).json({ success: false, message: err3.message });
                            }

                            return res.json({
                                success: true,
                                voter: {
                                    id: this.lastID,
                                    voter_id: nextId,
                                    name: cleanName,
                                    email: cleanEmail,
                                    voted: 0,
                                    role: "voter"
                                }
                            });
                        }
                    );
                }
            );
        }
    );
});

/**
 * GET /api/voters
 * ─────────────────────────────────────────────────────
 * Returns all voters (PIN excluded). Kept here too so
 * this route file is self-contained / drop-in capable.
 */
router.get("/", (req, res) => {
    db.all(
        "SELECT id, voter_id, name, email, voted, role FROM voters ORDER BY id DESC",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json(rows);
        }
    );
});

/**
 * DELETE /api/voters/:voter_id
 * ─────────────────────────────────────────────────────
 * Admin-only: remove a voter who has NOT yet voted.
 * Prevents deleting anyone with a vote already cast,
 * to preserve audit integrity.
 */
router.delete("/:voter_id", (req, res) => {
    const { voter_id } = req.params;

    db.get(
        "SELECT voted FROM voters WHERE voter_id = ?",
        [voter_id],
        (err, voter) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!voter) return res.status(404).json({ success: false, message: "Voter not found." });
            if (voter.voted) {
                return res.status(409).json({
                    success: false,
                    message: "Cannot remove a voter who has already voted."
                });
            }

            db.run(
                "DELETE FROM voters WHERE voter_id = ?",
                [voter_id],
                (err2) => {
                    if (err2) return res.status(500).json({ success: false, message: err2.message });
                    res.json({ success: true });
                }
            );
        }
    );
});

module.exports = router;