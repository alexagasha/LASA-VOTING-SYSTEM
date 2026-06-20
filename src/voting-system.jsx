import { useState, useEffect, useCallback } from "react";

// ── Palette & design tokens ──────────────────────────────────────────────────
// Deep navy civic authority + electric teal action + amber warning
// Typography: "Inter" for data, "Georgia" for display headers
// Signature element: animated real-time vote bar with live pulse dot

const COLORS = {
  navy: "#0F1F3D",
  navyLight: "#1A3260",
  teal: "#00B4A6",
  tealDark: "#008F84",
  amber: "#F59E0B",
  red: "#EF4444",
  green: "#10B981",
  white: "#FFFFFF",
  offWhite: "#F0F4F8",
  gray100: "#E2E8F0",
  gray400: "#94A3B8",
  gray600: "#475569",
  gray800: "#1E293B",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: ${COLORS.offWhite}; color: ${COLORS.gray800}; }
  
  .vs-app { min-height: 100vh; }
  
  /* Header */
  .vs-header {
    background: ${COLORS.navy};
    padding: 14px 32px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }
  .vs-logo { display: flex; align-items: center; gap: 12px; }
  .vs-logo-icon {
    width: 38px; height: 38px; background: ${COLORS.teal};
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }
  .vs-logo-text { color: white; font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
  .vs-logo-sub { color: ${COLORS.teal}; font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; }
  .vs-header-right { display: flex; align-items: center; gap: 12px; }
  .vs-user-badge {
    background: rgba(255,255,255,0.1); border-radius: 6px;
    padding: 6px 12px; color: white; font-size: 13px;
    display: flex; align-items: center; gap: 8px;
  }
  .vs-live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: ${COLORS.green}; display: inline-block;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.4); }
  }

  /* Nav tabs */
  .vs-nav {
    background: ${COLORS.navyLight};
    display: flex; gap: 4px; padding: 0 32px;
  }
  .vs-nav-tab {
    padding: 12px 20px; color: ${COLORS.gray400}; font-size: 13px; font-weight: 500;
    cursor: pointer; border-bottom: 2px solid transparent;
    transition: all 0.2s; white-space: nowrap;
    background: none; border-top: none; border-left: none; border-right: none;
  }
  .vs-nav-tab:hover { color: white; }
  .vs-nav-tab.active { color: ${COLORS.teal}; border-bottom-color: ${COLORS.teal}; }

  /* Main content */
  .vs-main { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
  .vs-page-title { font-size: 22px; font-weight: 700; color: ${COLORS.gray800}; margin-bottom: 6px; }
  .vs-page-sub { color: ${COLORS.gray600}; font-size: 14px; margin-bottom: 24px; }

  /* Cards */
  .vs-card {
    background: white; border-radius: 12px;
    border: 1px solid ${COLORS.gray100};
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    padding: 24px; margin-bottom: 20px;
  }
  .vs-card-title { font-size: 16px; font-weight: 600; color: ${COLORS.gray800}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

  /* Stats row */
  .vs-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .vs-stat {
    background: white; border-radius: 12px; padding: 20px;
    border: 1px solid ${COLORS.gray100};
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .vs-stat-label { font-size: 12px; font-weight: 500; color: ${COLORS.gray400}; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
  .vs-stat-value { font-size: 32px; font-weight: 700; color: ${COLORS.navy}; line-height: 1; }
  .vs-stat-delta { font-size: 12px; color: ${COLORS.green}; margin-top: 4px; }

  /* Vote bars — signature element */
  .vs-candidate {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 0; border-bottom: 1px solid ${COLORS.gray100};
  }
  .vs-candidate:last-child { border-bottom: none; }
  .vs-candidate-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: white; flex-shrink: 0;
  }
  .vs-candidate-info { flex: 1; min-width: 0; }
  .vs-candidate-name { font-size: 15px; font-weight: 600; color: ${COLORS.gray800}; }
  .vs-candidate-party { font-size: 12px; color: ${COLORS.gray400}; }
  .vs-candidate-bar-wrap { flex: 2; }
  .vs-bar-row { display: flex; align-items: center; gap: 10px; }
  .vs-bar-track {
    flex: 1; height: 10px; background: ${COLORS.gray100};
    border-radius: 99px; overflow: hidden;
  }
  .vs-bar-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.8s cubic-bezier(0.23,1,0.32,1);
  }
  .vs-bar-pct { font-size: 14px; font-weight: 700; color: ${COLORS.gray800}; min-width: 42px; text-align: right; }
  .vs-vote-count { font-size: 12px; color: ${COLORS.gray400}; margin-top: 2px; }
  .vs-leader-badge {
    background: ${COLORS.amber}; color: white; font-size: 10px;
    font-weight: 700; padding: 2px 8px; border-radius: 99px;
    letter-spacing: 0.5px; text-transform: uppercase; margin-left: 8px;
  }

  /* Buttons */
  .vs-btn {
    padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px;
  }
  .vs-btn-primary { background: ${COLORS.teal}; color: white; }
  .vs-btn-primary:hover { background: ${COLORS.tealDark}; }
  .vs-btn-outline { background: white; color: ${COLORS.navy}; border: 1.5px solid ${COLORS.gray100}; }
  .vs-btn-outline:hover { border-color: ${COLORS.teal}; color: ${COLORS.teal}; }
  .vs-btn-danger { background: ${COLORS.red}; color: white; }
  .vs-btn-danger:hover { background: #DC2626; }
  .vs-btn-sm { padding: 6px 12px; font-size: 12px; }

  /* Form */
  .vs-input {
    width: 100%; padding: 9px 13px; border: 1.5px solid ${COLORS.gray100};
    border-radius: 8px; font-size: 14px; color: ${COLORS.gray800};
    transition: border-color 0.2s; outline: none;
    font-family: inherit;
  }
  .vs-input:focus { border-color: ${COLORS.teal}; }
  .vs-label { font-size: 13px; font-weight: 500; color: ${COLORS.gray600}; margin-bottom: 5px; display: block; }
  .vs-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .vs-form-group { margin-bottom: 14px; }

  /* Table */
  .vs-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .vs-table th {
    text-align: left; padding: 10px 14px; font-size: 11px;
    font-weight: 600; color: ${COLORS.gray400}; letter-spacing: 0.5px;
    text-transform: uppercase; background: ${COLORS.offWhite};
    border-bottom: 1px solid ${COLORS.gray100};
  }
  .vs-table td {
    padding: 12px 14px; border-bottom: 1px solid ${COLORS.gray100};
    color: ${COLORS.gray800};
  }
  .vs-table tr:last-child td { border-bottom: none; }
  .vs-table tr:hover td { background: ${COLORS.offWhite}; }

  /* Badge */
  .vs-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600;
  }
  .vs-badge-green { background: #D1FAE5; color: #065F46; }
  .vs-badge-red { background: #FEE2E2; color: #991B1B; }
  .vs-badge-blue { background: #DBEAFE; color: #1E40AF; }
  .vs-badge-amber { background: #FEF3C7; color: #92400E; }

  /* Login */
  .vs-login {
    min-height: 100vh; background: ${COLORS.navy};
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .vs-login-box {
    background: white; border-radius: 16px; padding: 40px;
    width: 100%; max-width: 420px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  }
  .vs-login-icon { font-size: 40px; text-align: center; margin-bottom: 8px; }
  .vs-login-title { font-size: 24px; font-weight: 700; color: ${COLORS.navy}; text-align: center; margin-bottom: 4px; }
  .vs-login-sub { font-size: 14px; color: ${COLORS.gray400}; text-align: center; margin-bottom: 28px; }
  .vs-divider { height: 1px; background: ${COLORS.gray100}; margin: 20px 0; }

  /* Vote modal */
  .vs-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  }
  .vs-modal {
    background: white; border-radius: 16px; padding: 32px;
    max-width: 480px; width: 100%;
    animation: modalIn 0.2s ease-out;
  }
  @keyframes modalIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .vs-modal-title { font-size: 20px; font-weight: 700; color: ${COLORS.navy}; margin-bottom: 6px; }
  .vs-modal-sub { font-size: 14px; color: ${COLORS.gray600}; margin-bottom: 20px; }
  .vs-vote-option {
    border: 2px solid ${COLORS.gray100}; border-radius: 10px;
    padding: 14px 16px; cursor: pointer; margin-bottom: 10px;
    display: flex; align-items: center; gap: 14px;
    transition: all 0.15s;
  }
  .vs-vote-option:hover { border-color: ${COLORS.teal}; background: #F0FDFA; }
  .vs-vote-option.selected { border-color: ${COLORS.teal}; background: #F0FDFA; }
  .vs-radio {
    width: 20px; height: 20px; border-radius: 50%; border: 2px solid ${COLORS.gray400};
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .vs-radio.checked { border-color: ${COLORS.teal}; }
  .vs-radio-inner { width: 10px; height: 10px; border-radius: 50%; background: ${COLORS.teal}; }

  /* Alert */
  .vs-alert {
    padding: 12px 16px; border-radius: 8px; font-size: 13px;
    margin-bottom: 14px; display: flex; align-items: center; gap: 10px;
  }
  .vs-alert-success { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
  .vs-alert-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
  .vs-alert-info { background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; }

  /* Audit log */
  .vs-log-entry {
    padding: 12px 0; border-bottom: 1px solid ${COLORS.gray100};
    display: flex; gap: 12px; align-items: flex-start;
  }
  .vs-log-entry:last-child { border-bottom: none; }
  .vs-log-time { font-size: 11px; color: ${COLORS.gray400}; min-width: 75px; margin-top: 1px; font-family: monospace; }
  .vs-log-icon { font-size: 16px; min-width: 22px; }
  .vs-log-text { font-size: 13px; color: ${COLORS.gray700}; }
  .vs-log-detail { font-size: 12px; color: ${COLORS.gray400}; margin-top: 2px; }

  /* Responsive */
  @media (max-width: 768px) {
    .vs-main { padding: 16px; }
    .vs-stats { grid-template-columns: 1fr 1fr; }
    .vs-form-row { grid-template-columns: 1fr; }
    .vs-nav { padding: 0 16px; overflow-x: auto; }
    .vs-header { padding: 12px 16px; }
  }
  @media (max-width: 500px) {
    .vs-stats { grid-template-columns: 1fr; }
  }

  .vs-empty { text-align: center; padding: 40px 20px; color: ${COLORS.gray400}; }
  .vs-empty-icon { font-size: 40px; margin-bottom: 12px; }
  .vs-flex { display: flex; align-items: center; gap: 10px; }
  .vs-flex-between { display: flex; align-items: center; justify-content: space-between; }
  .vs-mb { margin-bottom: 16px; }
  .vs-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .vs-success-check { font-size: 60px; text-align: center; margin: 10px 0 16px; }
`;

// ── Seed data ───────────────────────────────────────────────────────────────
const CANDIDATE_COLORS = ["#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6","#8B5CF6"];

const initCandidates = [
  { id: 1, name: "Amongi Dolly Diana", party: "Gulu University", color: CANDIDATE_COLORS[0], votes: 0 },
  { id: 2, name: "Arac Benedict", party: "Lira University", color: CANDIDATE_COLORS[1], votes: 0 },
  { id: 3, name: "Aceng Delight Ruth", party: "Uganda Christian University(UCU)", color: CANDIDATE_COLORS[2], votes: 0 },
];

const initVoters = [
  { id: "V001", name: "Alice Johnson", email: "alice@example.com", pin: "1234", voted: false, role: "voter" },
  { id: "V002", name: "Bob Martinez",  email: "bob@example.com",   pin: "5678", voted: false, role: "voter" },
  { id: "V003", name: "Carol Davis",   email: "carol@example.com", pin: "9012", voted: false, role: "voter" },
  { id: "A001", name: "Admin User",    email: "admin@example.com", pin: "0000", voted: false, role: "admin" },
];

function ts() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Utility: simple CSV/TSV for export ──────────────────────────────────────
function exportCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
}

// ── Sub-components ──────────────────────────────────────────────────────────

function VoteBar({ candidate, totalVotes, isLeader }) {
  const pct = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0;
  return (
    <div className="vs-candidate">
      <div className="vs-candidate-avatar" style={{ background: candidate.color }}>
        {candidate.name.charAt(0)}
      </div>
      <div className="vs-candidate-info">
        <div className="vs-candidate-name">
          {candidate.name}
          {isLeader && totalVotes > 0 && <span className="vs-leader-badge">Leading</span>}
        </div>
        <div className="vs-candidate-party">{candidate.party}</div>
      </div>
      <div className="vs-candidate-bar-wrap">
        <div className="vs-bar-row">
          <div className="vs-bar-track">
            <div className="vs-bar-fill" style={{ width: `${pct}%`, background: candidate.color }} />
          </div>
          <div className="vs-bar-pct">{pct}%</div>
        </div>
        <div className="vs-vote-count">{candidate.votes.toLocaleString()} vote{candidate.votes !== 1 ? "s" : ""}</div>
      </div>
    </div>
  );
}

function LoginScreen({ voters, onLogin, alert }) {
  const [email, setEmail] = useState("");
  const [pin, setPin]     = useState("");
  return (
    <div className="vs-login">
      <div className="vs-login-box">
        <div className="vs-login-icon">🗳️</div>
        <div className="vs-login-title">SecureVote</div>
        <div className="vs-login-sub">Authenticated digital voting platform</div>
        {alert && <div className={`vs-alert vs-alert-${alert.type}`}>{alert.msg}</div>}
        <div className="vs-form-group">
          <label className="vs-label">Email address</label>
          <input className="vs-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="vs-form-group">
          <label className="vs-label">Voter PIN</label>
          <input className="vs-input" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" maxLength={8} />
        </div>
        <button className="vs-btn vs-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }}
          onClick={() => onLogin(email, pin)}>Sign In & Authenticate →</button>
        <div className="vs-divider" />
        <div style={{ fontSize: 12, color: COLORS.gray400, textAlign: "center", lineHeight: "1.6" }}>
          Demo credentials — Voter: alice@example.com / 1234 &nbsp;|&nbsp; Admin: admin@example.com / 0000
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function VotingSystem() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginAlert,  setLoginAlert]  = useState(null);
  const [tab,         setTab]         = useState("dashboard");
  const [candidates,  setCandidates]  = useState(initCandidates);
  const [voters,      setVoters]      = useState(initVoters);
  const [auditLog,    setAuditLog]    = useState([
    { time: "08:00:00", icon: "🔒", text: "Election session started", detail: "System initialized" },
  ]);
  const [voteModal,   setVoteModal]   = useState(false);
  const [selectedCand, setSelectedCand] = useState(null);
  const [voteSuccess,  setVoteSuccess]  = useState(false);
  const [electionOpen, setElectionOpen] = useState(true);

  // Candidate form
  const [candForm, setCandForm] = useState({ name: "", party: "" });

  // Voter form
  const [voterForm, setVoterForm] = useState({ id: "", name: "", email: "", pin: "" });

  const [appAlert, setAppAlert] = useState(null);

  const addLog = useCallback((icon, text, detail = "") => {
    setAuditLog(prev => [{ time: ts(), icon, text, detail }, ...prev]);
  }, []);

  const totalVotes  = candidates.reduce((s, c) => s + c.votes, 0);
  const votedCount  = voters.filter(v => v.voted).length;
  const leaderId    = candidates.reduce((a, b) => (b.votes > a.votes ? b : a), candidates[0]).id;
  const turnout     = voters.length > 0 ? ((votedCount / voters.filter(v => v.role === "voter").length) * 100).toFixed(1) : 0;

  // Login
  function handleLogin(email, pin) {
    const voter = voters.find(v => v.email === email && v.pin === pin);
    if (!voter) { setLoginAlert({ type: "error", msg: "Invalid credentials. Please check your email and PIN." }); return; }
    setCurrentUser(voter);
    setLoginAlert(null);
    addLog("🔑", `User authenticated`, `${voter.name} (${voter.role})`);
  }

  function handleLogout() {
    addLog("🚪", `User signed out`, currentUser?.name);
    setCurrentUser(null);
    setTab("dashboard");
    setVoteSuccess(false);
  }

  // Cast vote
  function castVote() {
    if (!selectedCand) return;
    if (!electionOpen) { setAppAlert({ type: "error", msg: "Voting is currently closed." }); return; }
    const voter = voters.find(v => v.id === currentUser.id);
    if (voter?.voted) { setAppAlert({ type: "error", msg: "You have already cast your vote." }); return; }

    setCandidates(prev => prev.map(c => c.id === selectedCand ? { ...c, votes: c.votes + 1 } : c));
    setVoters(prev => prev.map(v => v.id === currentUser.id ? { ...v, voted: true } : v));
    setCurrentUser(prev => ({ ...prev, voted: true }));

    const cand = candidates.find(c => c.id === selectedCand);
    addLog("🗳️", `Vote recorded`, `${currentUser.name} voted`);
    setVoteModal(false);
    setSelectedCand(null);
    setVoteSuccess(true);
    setTab("dashboard");
  }

  // Add candidate
  function addCandidate() {
    if (!candForm.name.trim()) { setAppAlert({ type: "error", msg: "Candidate name is required." }); return; }
    const newC = {
      id: Date.now(), name: candForm.name.trim(), party: candForm.party.trim() || "Independent",
      color: CANDIDATE_COLORS[candidates.length % CANDIDATE_COLORS.length], votes: 0,
    };
    setCandidates(prev => [...prev, newC]);
    addLog("➕", `Candidate added`, `${newC.name} (${newC.party})`);
    setCandForm({ name: "", party: "" });
    setAppAlert({ type: "success", msg: `${newC.name} added successfully.` });
  }

  function removeCandidate(id) {
    const c = candidates.find(x => x.id === id);
    if (c.votes > 0) { setAppAlert({ type: "error", msg: "Cannot remove candidate with existing votes." }); return; }
    setCandidates(prev => prev.filter(x => x.id !== id));
    addLog("🗑️", `Candidate removed`, c.name);
  }

  // Add voter
  function addVoter() {
    if (!voterForm.name || !voterForm.email || !voterForm.pin) { setAppAlert({ type: "error", msg: "All voter fields are required." }); return; }
    if (voters.find(v => v.email === voterForm.email)) { setAppAlert({ type: "error", msg: "Voter with this email already exists." }); return; }
    const newV = { ...voterForm, id: `V${Date.now()}`, voted: false, role: "voter" };
    setVoters(prev => [...prev, newV]);
    addLog("👤", `Voter registered`, `${newV.name} (${newV.email})`);
    setVoterForm({ id: "", name: "", email: "", pin: "" });
    setAppAlert({ type: "success", msg: `${newV.name} registered.` });
  }

  // Export
  function exportResults() {
    const rows = [
      ["Candidate", "Party", "Votes", "Percentage"],
      ...candidates.map(c => [c.name, c.party, c.votes, totalVotes > 0 ? ((c.votes/totalVotes)*100).toFixed(2)+"%" : "0%"]),
      ["", "", "", ""],
      ["Total Votes", totalVotes, "", ""],
      ["Turnout", turnout + "%", "", ""],
    ];
    exportCSV(rows, "election-results.csv");
    addLog("📊", "Results exported", "CSV download");
  }

  function exportAudit() {
    const rows = [["Time", "Event", "Details"], ...auditLog.map(l => [l.time, l.text, l.detail])];
    exportCSV(rows, "audit-log.csv");
    addLog("📋", "Audit log exported", "CSV download");
  }

  if (!currentUser) return (
    <>
      <style>{css}</style>
      <LoginScreen voters={voters} onLogin={handleLogin} alert={loginAlert} />
    </>
  );

  const isAdmin = currentUser.role === "admin";

  const TABS = isAdmin
    ? [
        { id: "dashboard", label: "📊 Dashboard" },
        { id: "vote",      label: "🗳️ Cast Vote" },
        { id: "candidates",label: "👥 Candidates" },
        { id: "voters",    label: "📋 Voters" },
        { id: "results",   label: "🏆 Results" },
        { id: "audit",     label: "🔍 Audit Log" },
      ]
    : [
        { id: "dashboard", label: "📊 Dashboard" },
        { id: "vote",      label: "🗳️ Cast Vote" },
        { id: "results",   label: "🏆 Results" },
      ];

  return (
    <>
      <style>{css}</style>
      <div className="vs-app">
        {/* Header */}
        <div className="vs-header">
          <div className="vs-logo">
            <div className="vs-logo-icon">🗳️</div>
            <div>
              <div className="vs-logo-text">SecureVote</div>
              <div className="vs-logo-sub">Digital Voting Platform</div>
            </div>
          </div>
          <div className="vs-header-right">
            <div className="vs-user-badge">
              <span className="vs-live-dot" />
              {currentUser.name}
              {currentUser.voted && <span className="vs-badge vs-badge-green" style={{fontSize:10}}>✓ Voted</span>}
              {isAdmin && <span className="vs-badge vs-badge-amber" style={{fontSize:10}}>Admin</span>}
            </div>
            <button className="vs-btn vs-btn-outline vs-btn-sm" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        {/* Nav */}
        <div className="vs-nav">
          {TABS.map(t => (
            <button key={t.id} className={`vs-nav-tab${tab === t.id ? " active" : ""}`} onClick={() => { setTab(t.id); setAppAlert(null); }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="vs-main">
          {appAlert && (
            <div className={`vs-alert vs-alert-${appAlert.type}`}>
              {appAlert.type === "success" ? "✅" : "❌"} {appAlert.msg}
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <>
              <div className="vs-page-title">Election Dashboard</div>
              <div className="vs-page-sub">Real-time overview • Updates live as votes are cast</div>

              {voteSuccess && (
                <div className="vs-alert vs-alert-success">
                  ✅ Your vote has been recorded. Thank you for participating!
                </div>
              )}

              <div className="vs-stats">
                <div className="vs-stat">
                  <div className="vs-stat-label">Total Votes</div>
                  <div className="vs-stat-value">{totalVotes}</div>
                  <div className="vs-stat-delta">↑ live count</div>
                </div>
                <div className="vs-stat">
                  <div className="vs-stat-label">Voter Turnout</div>
                  <div className="vs-stat-value">{turnout}%</div>
                  <div className="vs-stat-delta">{votedCount} of {voters.filter(v=>v.role==="voter").length} eligible</div>
                </div>
                <div className="vs-stat">
                  <div className="vs-stat-label">Candidates</div>
                  <div className="vs-stat-value">{candidates.length}</div>
                </div>
                <div className="vs-stat">
                  <div className="vs-stat-label">Election Status</div>
                  <div className="vs-stat-value" style={{ fontSize: 20, marginTop: 4 }}>
                    {electionOpen
                      ? <span className="vs-badge vs-badge-green">Open</span>
                      : <span className="vs-badge vs-badge-red">Closed</span>}
                  </div>
                  {isAdmin && (
                    <button className={`vs-btn vs-btn-sm ${electionOpen ? "vs-btn-danger" : "vs-btn-primary"}`}
                      style={{ marginTop: 8 }}
                      onClick={() => { setElectionOpen(!electionOpen); addLog(electionOpen ? "🔒" : "🔓", `Election ${electionOpen ? "closed" : "opened"}`, "Admin action"); }}>
                      {electionOpen ? "Close Voting" : "Open Voting"}
                    </button>
                  )}
                </div>
              </div>

              <div className="vs-card">
                <div className="vs-card-title">
                  Live Vote Tally
                  <span className="vs-live-dot" style={{ marginLeft: 6 }} />
                </div>
                {candidates.map(c => (
                  <VoteBar key={c.id} candidate={c} totalVotes={totalVotes} isLeader={c.id === leaderId} />
                ))}
                {candidates.length === 0 && <div className="vs-empty"><div className="vs-empty-icon">👥</div>No candidates yet.</div>}
              </div>
            </>
          )}

          {/* ── CAST VOTE ── */}
          {tab === "vote" && (
            <>
              <div className="vs-page-title">Cast Your Vote</div>
              <div className="vs-page-sub">Your vote is anonymous and securely recorded</div>

              {currentUser.voted ? (
                <div className="vs-card" style={{ textAlign: "center", padding: "48px 24px" }}>
                  <div className="vs-success-check">✅</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>Vote Already Cast</div>
                  <div style={{ color: COLORS.gray600, fontSize: 14 }}>You have already submitted your vote in this election. Each voter may only vote once.</div>
                </div>
              ) : !electionOpen ? (
                <div className="vs-alert vs-alert-error">🔒 Voting is currently closed. Please check back later.</div>
              ) : (
                <div className="vs-card">
                  <div className="vs-card-title">Select a Candidate</div>
                  {candidates.map(c => (
                    <div key={c.id} className={`vs-vote-option${selectedCand === c.id ? " selected" : ""}`}
                      onClick={() => setSelectedCand(c.id)}>
                      <div className={`vs-radio${selectedCand === c.id ? " checked" : ""}`}>
                        {selectedCand === c.id && <div className="vs-radio-inner" />}
                      </div>
                      <div className="vs-candidate-avatar" style={{ background: c.color, width: 36, height: 36, fontSize: 16, borderRadius: "50%", display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,flexShrink:0 }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.gray400 }}>{c.party}</div>
                      </div>
                    </div>
                  ))}
                  {candidates.length === 0 && <div className="vs-empty">No candidates available.</div>}
                  {candidates.length > 0 && (
                    <button className="vs-btn vs-btn-primary" style={{ marginTop: 16, width: "100%", justifyContent: "center", padding: "12px" }}
                      disabled={!selectedCand} onClick={() => setVoteModal(true)}>
                      Submit Vote →
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── CANDIDATES (admin) ── */}
          {tab === "candidates" && isAdmin && (
            <>
              <div className="vs-page-title">Candidate Management</div>
              <div className="vs-page-sub">Add or remove election candidates</div>

              <div className="vs-card">
                <div className="vs-card-title">➕ Add Candidate</div>
                <div className="vs-form-row">
                  <div>
                    <label className="vs-label">Full Name</label>
                    <input className="vs-input" value={candForm.name} onChange={e => setCandForm(p => ({...p, name: e.target.value}))} placeholder="Candidate name" />
                  </div>
                  <div>
                    <label className="vs-label">Party / Affiliation</label>
                    <input className="vs-input" value={candForm.party} onChange={e => setCandForm(p => ({...p, party: e.target.value}))} placeholder="Party name or Independent" />
                  </div>
                </div>
                <button className="vs-btn vs-btn-primary" onClick={addCandidate}>Add Candidate</button>
              </div>

              <div className="vs-card">
                <div className="vs-card-title">Current Candidates ({candidates.length})</div>
                <table className="vs-table">
                  <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th>Action</th></tr></thead>
                  <tbody>
                    {candidates.map(c => (
                      <tr key={c.id}>
                        <td><div className="vs-flex"><div style={{ width:28, height:28, borderRadius:"50%", background:c.color, display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:13 }}>{c.name.charAt(0)}</div>{c.name}</div></td>
                        <td>{c.party}</td>
                        <td><strong>{c.votes}</strong></td>
                        <td><button className="vs-btn vs-btn-danger vs-btn-sm" onClick={() => removeCandidate(c.id)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {candidates.length === 0 && <div className="vs-empty"><div className="vs-empty-icon">👥</div>No candidates yet.</div>}
              </div>
            </>
          )}

          {/* ── VOTERS (admin) ── */}
          {tab === "voters" && isAdmin && (
            <>
              <div className="vs-page-title">Voter Management</div>
              <div className="vs-page-sub">Register voters — each voter may cast exactly one vote</div>

              <div className="vs-card">
                <div className="vs-card-title">➕ Register Voter</div>
                <div className="vs-form-row">
                  <div>
                    <label className="vs-label">Full Name</label>
                    <input className="vs-input" value={voterForm.name} onChange={e => setVoterForm(p => ({...p, name: e.target.value}))} placeholder="Voter full name" />
                  </div>
                  <div>
                    <label className="vs-label">Email</label>
                    <input className="vs-input" value={voterForm.email} onChange={e => setVoterForm(p => ({...p, email: e.target.value}))} placeholder="voter@example.com" />
                  </div>
                </div>
                <div className="vs-form-group" style={{ maxWidth: 200 }}>
                  <label className="vs-label">PIN (4–8 digits)</label>
                  <input className="vs-input" value={voterForm.pin} onChange={e => setVoterForm(p => ({...p, pin: e.target.value}))} placeholder="e.g. 4321" maxLength={8} />
                </div>
                <button className="vs-btn vs-btn-primary" onClick={addVoter}>Register Voter</button>
              </div>

              <div className="vs-card">
                <div className="vs-flex-between vs-mb">
                  <div className="vs-card-title" style={{ margin: 0 }}>Registered Voters ({voters.filter(v=>v.role==="voter").length})</div>
                </div>
                <table className="vs-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th></tr></thead>
                  <tbody>
                    {voters.filter(v=>v.role==="voter").map(v => (
                      <tr key={v.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{v.id}</td>
                        <td>{v.name}</td>
                        <td>{v.email}</td>
                        <td>{v.voted ? <span className="vs-badge vs-badge-green">✓ Voted</span> : <span className="vs-badge vs-badge-blue">Pending</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── RESULTS ── */}
          {tab === "results" && (
            <>
              <div className="vs-flex-between vs-mb">
                <div>
                  <div className="vs-page-title">Election Results</div>
                  <div className="vs-page-sub">Final standings • {totalVotes} votes counted</div>
                </div>
                <button className="vs-btn vs-btn-outline" onClick={exportResults}>⬇️ Export CSV</button>
              </div>

              <div className="vs-card">
                <div className="vs-card-title">Final Vote Count</div>
                {[...candidates].sort((a,b) => b.votes - a.votes).map((c, i) => (
                  <VoteBar key={c.id} candidate={c} totalVotes={totalVotes} isLeader={c.id === leaderId} />
                ))}
              </div>

              <div className="vs-grid2">
                <div className="vs-card">
                  <div className="vs-card-title">📈 Participation</div>
                  <div style={{ fontSize: 40, fontWeight: 700, color: COLORS.navy }}>{turnout}%</div>
                  <div style={{ color: COLORS.gray600, fontSize: 14, marginTop: 4 }}>
                    {votedCount} of {voters.filter(v=>v.role==="voter").length} registered voters participated
                  </div>
                </div>
                <div className="vs-card">
                  <div className="vs-card-title">🏆 Current Leader</div>
                  {totalVotes > 0 ? (() => {
                    const leader = candidates.find(c => c.id === leaderId);
                    return <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy }}>{leader?.name}</div>
                      <div style={{ color: COLORS.gray400, fontSize: 13, marginTop: 4 }}>{leader?.party}</div>
                      <div style={{ color: COLORS.gray600, fontSize: 14, marginTop: 8 }}>
                        {leader?.votes} votes · {((leader?.votes/totalVotes)*100).toFixed(1)}%
                      </div>
                    </>;
                  })() : <div style={{ color: COLORS.gray400 }}>No votes cast yet</div>}
                </div>
              </div>
            </>
          )}

          {/* ── AUDIT LOG ── */}
          {tab === "audit" && isAdmin && (
            <>
              <div className="vs-flex-between vs-mb">
                <div>
                  <div className="vs-page-title">Audit Log</div>
                  <div className="vs-page-sub">Immutable record of all system events</div>
                </div>
                <button className="vs-btn vs-btn-outline" onClick={exportAudit}>⬇️ Export Log</button>
              </div>

              <div className="vs-card">
                <div className="vs-card-title">🔍 Activity Trail ({auditLog.length} entries)</div>
                {auditLog.map((l, i) => (
                  <div key={i} className="vs-log-entry">
                    <div className="vs-log-time">{l.time}</div>
                    <div className="vs-log-icon">{l.icon}</div>
                    <div>
                      <div className="vs-log-text">{l.text}</div>
                      {l.detail && <div className="vs-log-detail">{l.detail}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Vote confirmation modal */}
        {voteModal && (
          <div className="vs-overlay" onClick={e => e.target === e.currentTarget && setVoteModal(false)}>
            <div className="vs-modal">
              <div className="vs-modal-title">Confirm Your Vote</div>
              <div className="vs-modal-sub">This action cannot be undone. You may only vote once.</div>
              {(() => {
                const c = candidates.find(x => x.id === selectedCand);
                return c ? (
                  <div style={{ background: COLORS.offWhite, borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: c.color, display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:20 }}>{c.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.navy }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: COLORS.gray400 }}>{c.party}</div>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="vs-flex">
                <button className="vs-btn vs-btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={castVote}>
                  ✓ Confirm Vote
                </button>
                <button className="vs-btn vs-btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setVoteModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
