const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.post("/cast", (req, res) => {
    const { voter_id, candidate_id } = req.body;

    db.get(
        "SELECT * FROM voters WHERE voter_id = ?",
        [voter_id],
        (err, voter) => {

            if (err)
                return res.status(500).json({ error: err.message });

            if (!voter)
                return res.status(404).json({
                    message: "Voter not found"
                });

            if (voter.voted === 1)
                return res.status(400).json({
                    message: "You have already voted"
                });

            db.run(
                "INSERT INTO votes(voter_id,candidate_id) VALUES(?,?)",
                [voter_id, candidate_id],
                function(err) {

                    if (err)
                        return res.status(500).json({
                            error: err.message
                        });

                    db.run(
                        "UPDATE candidates SET votes = votes + 1 WHERE id = ?",
                        [candidate_id]
                    );

                    db.run(
                        "UPDATE voters SET voted = 1 WHERE voter_id = ?",
                        [voter_id]
                    );

                    res.json({
                        success: true,
                        message: "Vote submitted successfully"
                    });
                }
            );
        }
    );
});

module.exports = router;