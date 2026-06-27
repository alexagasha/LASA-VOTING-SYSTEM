require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const voteRoutes = require("./routes/vote");
const resultRoutes = require("./routes/results");

const supabase = require("./config/supabase");

const app = express();

app.use(cors());
app.use(express.json());

/**
 * =========================
 * ROOT
 * =========================
 */
app.get("/", (req, res) => {
    res.send("LASA Voting API Running");
});

/**
 * =========================
 * ROUTES
 * =========================
 */
app.use("/api/auth", authRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/results", resultRoutes);

/**
 * =========================
 * GET ALL CANDIDATES
 * =========================
 */
app.get("/api/candidates", async (req, res) => {

    const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("votes", { ascending: false });

    if (error) {
        return res.status(500).json({
            error: error.message
        });
    }

    res.json(data);

});

/**
 * =========================
 * GET ALL VOTERS
 * =========================
 */
app.get("/api/voters", async (req, res) => {

    const { data, error } = await supabase
        .from("voters")
        .select("id,voter_id,name,email,voted,role");

    if (error) {
        return res.status(500).json({
            error: error.message
        });
    }

    res.json(data);

});

/**
 * =========================
 * VOTER STATISTICS
 * =========================
 */
app.get("/api/voters/count", async (req, res) => {

    const { data, error } = await supabase
        .from("voters")
        .select("voted");

    if (error) {
        return res.status(500).json({
            error: error.message
        });
    }

    const total = data.length;
    const voted = data.filter(v => v.voted === 1).length;
    const remaining = total - voted;

    res.json({
        total,
        voted,
        remaining
    });

});


/**
 * =========================
 * ELECTION STATUS
 * =========================
 */
app.get("/api/election/status", async (req, res) => {
    const { data, error } = await supabase
        .from("settings")
        .select("election_open")
        .eq("id", 1)
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ election_open: data.election_open });
});

app.post("/api/election/status", async (req, res) => {
    const { election_open } = req.body;

    if (typeof election_open !== "boolean") {
        return res.status(400).json({ error: "election_open must be true or false" });
    }

    const { data, error } = await supabase
        .from("settings")
        .update({ election_open, updated_at: new Date().toISOString() })
        .eq("id", 1)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ election_open: data.election_open });
});

supabase
  .channel("candidates")
  .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, payload => {
    console.log(payload);
  })
  .subscribe();

/**
 * =========================
 * SERVER START
 * =========================
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});