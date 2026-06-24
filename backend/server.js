require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const authRoutes   = require("./routes/auth");
const voteRoutes   = require("./routes/vote");
const resultRoutes = require("./routes/results");
const supabase = require("./db/supabase");
const app = express();

// ── CORS ──────────────────────────────────────────────────
app.use(cors());
app.options("*", cors());  // handle preflight for all routes

app.use(express.json());

// ── Keep-alive ping (prevents Render free tier sleep) ─────
const https = require("https");
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || "";
if (BACKEND_URL) {
    setInterval(() => {
        https.get(BACKEND_URL).on("error", () => {});
    }, 10 * 60 * 1000);
}

// ── Health check ──────────────────────────────────────────
app.get("/", (req, res) => {
    res.send("LASA Voting API Running");
});

// ── Routes ────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/vote",    voteRoutes);
app.use("/api/results", resultRoutes);

// ── GET /api/candidates ───────────────────────────────────
app.get("/api/candidates", async (req, res) => {
    const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("votes", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ── GET /api/voters ───────────────────────────────────────
app.get("/api/voters", async (req, res) => {
    const { data, error } = await supabase
        .from("voters")
        .select("id, voter_id, name, email, voted, role")
        .order("voter_id");

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ── GET /api/voters/count ─────────────────────────────────
app.get("/api/voters/count", async (req, res) => {
    const { data, error } = await supabase
        .from("voters")
        .select("voted");

    if (error) return res.status(500).json({ error: error.message });

    const total     = data.length;
    const voted     = data.filter(v => v.voted === 1).length;
    const remaining = total - voted;

    res.json({ total, voted, remaining });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});