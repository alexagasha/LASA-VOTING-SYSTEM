const express = require("express");
const router = express.Router();
const supabase = require("../db/supabase");

/**
 * SAFE VOTING FLOW:
 * 1. Insert vote (blocked if duplicate)
 * 2. Atomic increment (RPC)
 * 3. Mark voter as voted
 */

router.post("/", async (req, res) => {
    try {
        const { voter_id, candidate_id } = req.body;

        if (!voter_id || !candidate_id) {
            return res.status(400).json({
                success: false,
                message: "Missing voter_id or candidate_id"
            });
        }

        // 1. INSERT VOTE (double vote protection via UNIQUE constraint)
        const { error: voteError } = await supabase
            .from("votes")
            .insert([{ voter_id, candidate_id }]);

        if (voteError) {
            return res.status(409).json({
                success: false,
                message: "You have already voted"
            });
        }

        // 2. ATOMIC INCREMENT (RPC FUNCTION)
        const { error: rpcError } = await supabase.rpc(
            "increment_candidate_vote",
            { candidate: candidate_id }
        );

        if (rpcError) {
            return res.status(500).json({
                success: false,
                message: rpcError.message
            });
        }

        // 3. MARK VOTER AS VOTED
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