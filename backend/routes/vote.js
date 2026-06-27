const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");

/**
 * POST /api/vote/cast
 * Body: { voter_id, candidate_id }
 */
router.post("/cast", async (req, res) => {
    try {
        const { voter_id, candidate_id } = req.body;

        if (!voter_id || !candidate_id) {
            return res.status(400).json({
                success: false,
                message: "Missing voter_id or candidate_id"
            });
        }

        // 0. Check election is open
        const { data: settings, error: settingsErr } = await supabase
            .from("settings")
            .select("election_open")
            .eq("id", 1)
            .single();

        if (settingsErr) {
            return res.status(500).json({
                success: false,
                message: "Could not verify election status"
            });
        }

        if (settings && settings.election_open === false) {
            return res.status(403).json({
                success: false,
                message: "The election is closed. Voting is no longer allowed."
            });
        }

        // 1. Check voter exists and hasn't already voted
        const { data: voter, error: voterErr } = await supabase
            .from("voters")
            .select("voter_id, voted")
            .eq("voter_id", voter_id)
            .single();

        if (voterErr || !voter) {
            return res.status(404).json({
                success: false,
                message: "Voter not found"
            });
        }

        if (voter.voted === 1) {
            return res.status(409).json({
                success: false,
                message: "You have already voted"
            });
        }

        // 2. Insert vote record
        const { error: voteError } = await supabase
            .from("votes")
            .insert([{ voter_id, candidate_id }]);

        if (voteError) {
            return res.status(409).json({
                success: false,
                message: "You have already voted"
            });
        }

        // 3. Increment candidate vote count (read-then-write)
        const { data: cand, error: candReadErr } = await supabase
            .from("candidates")
            .select("votes")
            .eq("id", candidate_id)
            .single();

        if (candReadErr || !cand) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found"
            });
        }

        const { error: candUpdateErr } = await supabase
            .from("candidates")
            .update({ votes: (cand.votes || 0) + 1 })
            .eq("id", candidate_id);

        if (candUpdateErr) {
            return res.status(500).json({
                success: false,
                message: candUpdateErr.message
            });
        }

        // 4. Mark voter as voted
        await supabase
            .from("voters")
            .update({ voted: 1 })
            .eq("voter_id", voter_id);

        return res.json({
            success: true,
            message: "Vote recorded successfully"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;