const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");

// POST /api/auth/login
// Body: { email, pin }
router.post("/login", async (req, res) => {
    try {
        const { email, pin } = req.body;

        if (!email || !pin) {
            return res.status(400).json({
                success: false,
                message: "Email and PIN are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Query Supabase instead of SQLite
        const { data: voters, error } = await supabase
            .from("voters")
            .select("*")
            .eq("email", normalizedEmail)
            .limit(1);

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        const voter = voters?.[0];

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: "No voter found with that email address"
            });
        }

        // PIN comparison (kept same logic)
        if (String(voter.pin) !== String(pin.trim())) {
            return res.status(401).json({
                success: false,
                message: "Incorrect PIN"
            });
        }

        // Remove sensitive field
        const { pin: _pin, ...safeVoter } = voter;

        return res.json({
            success: true,
            voter: safeVoter
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;