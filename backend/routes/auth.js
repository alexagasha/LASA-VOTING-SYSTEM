const express = require("express");
const router = express.Router();
const db = require("../db/db");

// POST /api/auth/login
// Body: { email, pin }
router.post("/login", (req, res) => {
    const { email, pin } = req.body;

    if (!email || !pin) {
        return res.status(400).json({
            success: false,
            message: "Email and PIN are required"
        });
    }

    db.get(
        "SELECT * FROM voters WHERE email = ?",
        [email.trim().toLowerCase()],
        (err, voter) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!voter) {
                return res.status(404).json({
                    success: false,
                    message: "No voter found with that email address"
                });
            }

            // Compare as strings to avoid type mismatch (SQLite may store as text or integer)
            if (String(voter.pin) !== String(pin.trim())) {
                return res.status(401).json({
                    success: false,
                    message: "Incorrect PIN"
                });
            }

            // Don't send the PIN back to the client
            const { pin: _pin, ...safeVoter } = voter;

            res.json({
                success: true,
                voter: safeVoter
            });
        }
    );
});

module.exports = router;