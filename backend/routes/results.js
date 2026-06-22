const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");

// GET LIVE RESULTS
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("candidates")
            .select("*")
            .order("votes", { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        return res.json({
            success: true,
            results: data
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;