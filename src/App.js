import React, { useState, useEffect, useCallback } from "react";

import "./styles/global.css";
import "./styles/theme.css";
import "./styles/components.css";
import "./styles/app-fixes.css";

const API = "http://localhost:5000/api/candidates"; // Adjust this if your backend runs on a different port or path

const ts = () =>
  new Date().toLocaleTimeString("en-GB", { hour12: false });

function exportCSV(rows, filename) {
  const csv = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, alert, loading }) {
  const [email, setEmail] = useState("");
  const [pin, setPin]     = useState("");

  return (
    <div className="vs-login">
      <div className="vs-login-box">
        <div className="vs-login-icon">🗳️</div>
        <div className="vs-login-title">SecureVote</div>
        <div className="vs-login-sub">LASA Joint Electoral Commission</div>

        {alert && (
          <div className={`vs-alert vs-alert-${alert.type}`}>{alert.msg}</div>
        )}

        <div className="vs-form-group">
          <label className="vs-label">Email address</label>
          <input
            className="vs-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            onKeyDown={(e) => e.key === "Enter" && onLogin(email, pin)}
          />
        </div>

        <div className="vs-form-group">
          <label className="vs-label">Voter PIN</label>
          <input
            className="vs-input"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            maxLength={8}
            onKeyDown={(e) => e.key === "Enter" && onLogin(email, pin)}
          />
        </div>

        <button
          className="vs-btn vs-btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "12px" }}
          disabled={loading}
          onClick={() => onLogin(email, pin)}
        >
          {loading ? "Authenticating…" : "Sign In & Authenticate →"}
        </button>

        <div className="vs-divider" />
        <div style={{ textAlign: "center", fontSize: "12px", color: "#6B7280" }}>
          Powered by AL Technologies · LASA 2025
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VotingSystem() {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [loginAlert,   setLoginAlert]   = useState(null);
  const [tab,          setTab]          = useState("dashboard");
  const [candidates,   setCandidates]   = useState([]);
  const [auditLog,     setAuditLog]     = useState([]);
  const [voteModal,    setVoteModal]    = useState(false);
  const [selectedCand, setSelectedCand] = useState(null);
  const [voteSuccess,  setVoteSuccess]  = useState(false);
  const [electionOpen, setElectionOpen] = useState(true);
  const [loading,      setLoading]      = useState(false);

  // ── Admin: voter management state ──────────────────────────────────────────
  const [voters,        setVoters]        = useState([]);
  const [voterForm,     setVoterForm]     = useState({ name: "", email: "", pin: "" });
  const [voterAlert,    setVoterAlert]    = useState(null);
  const [addingVoter,   setAddingVoter]   = useState(false);

  // ── Load candidates ────────────────────────────────────────────────────────
  const loadCandidates = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/results`);
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    }
  }, []);

  // ── Load voters (admin only) ──────────────────────────────────────────────
  const loadVoters = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/voters`);
      const data = await res.json();
      setVoters(data);
    } catch (err) {
      console.error("Failed to load voters:", err);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // ── Login — POST /api/auth/login with { email, pin } ──────────────────────
  const handleLogin = useCallback(async (email, pin) => {
    if (!email.trim() || !pin.trim()) {
      setLoginAlert({ type: "error", msg: "Please enter your email and PIN." });
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email: email.trim().toLowerCase(),
          pin:   pin.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginAlert({ type: "error", msg: data.message || "Login failed." });
        return;
      }

      // voter.voted is stored as integer 1/0 in SQLite
      if (data.voter.voted === 1) {
        setLoginAlert(null);
        setCurrentUser(data.voter);
        setVoteSuccess(true);
        setTab("results");
        return;
      }

      setLoginAlert(null);
      setCurrentUser(data.voter);
      setAuditLog((prev) => [
        ...prev,
        `[${ts()}] LOGIN: ${data.voter.email} authenticated`,
      ]);

      if (data.voter.role === "admin") {
        loadVoters();
      }
    } catch (err) {
      setLoginAlert({
        type: "error",
        msg:  "Cannot reach server. Make sure the backend is running.",
      });
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }, [loadVoters]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setTab("dashboard");
    setVoteModal(false);
    setSelectedCand(null);
    setVoteSuccess(false);
    setLoginAlert(null);
  }, []);

  // ── Cast vote — POST /api/vote/cast with { voter_id, candidate_id } ────────
  const handleVote = useCallback(async (candidateId) => {
    if (!currentUser || !electionOpen) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/vote/cast`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          voter_id:     currentUser.voter_id,
          candidate_id: candidateId,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Vote failed. Please try again.");
        return;
      }

      setVoteSuccess(true);
      setVoteModal(false);
      setSelectedCand(null);
      setAuditLog((prev) => [
        ...prev,
        `[${ts()}] VOTE: ${currentUser.email} voted for candidate #${candidateId}`,
      ]);
      await loadCandidates();
      setTab("results");
    } catch (err) {
      console.error("Vote error:", err);
      alert("Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [currentUser, electionOpen, loadCandidates]);

  // ── Add voter (admin) — POST /api/voters/add with { name, email, pin } ────
  const handleAddVoter = useCallback(async () => {
    const { name, email, pin } = voterForm;

    if (!name.trim() || !email.trim() || !pin.trim()) {
      setVoterAlert({ type: "error", msg: "Name, email, and PIN are all required." });
      return;
    }

    setAddingVoter(true);
    setVoterAlert(null);
    try {
      const res  = await fetch(`${API}/voters/add`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:  name.trim(),
          email: email.trim().toLowerCase(),
          pin:   pin.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setVoterAlert({ type: "error", msg: data.message || "Failed to add voter." });
        return;
      }

      setVoterAlert({
        type: "success",
        msg: `${data.voter.name} registered as ${data.voter.voter_id}.`,
      });
      setAuditLog((prev) => [
        ...prev,
        `[${ts()}] VOTER ADDED: ${data.voter.voter_id} — ${data.voter.name} (${data.voter.email})`,
      ]);
      setVoterForm({ name: "", email: "", pin: "" });
      await loadVoters();
    } catch (err) {
      console.error("Add voter error:", err);
      setVoterAlert({ type: "error", msg: "Cannot reach server. Is the backend running?" });
    } finally {
      setAddingVoter(false);
    }
  }, [voterForm, loadVoters]);

  // ── Remove voter (admin) — DELETE /api/voters/:voter_id ────────────────────
  const handleRemoveVoter = useCallback(async (voterId, voterName) => {
    if (!window.confirm(`Remove ${voterName} (${voterId})? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`${API}/voters/${voterId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setVoterAlert({ type: "error", msg: data.message || "Failed to remove voter." });
        return;
      }

      setAuditLog((prev) => [
        ...prev,
        `[${ts()}] VOTER REMOVED: ${voterId} — ${voterName}`,
      ]);
      await loadVoters();
    } catch (err) {
      console.error("Remove voter error:", err);
      setVoterAlert({ type: "error", msg: "Cannot reach server." });
    }
  }, [loadVoters]);

  // ── Show login if not authenticated ───────────────────────────────────────
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        alert={loginAlert}
        loading={loading}
      />
    );
  }

  const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);

  return (
    <div className="vs-app">

      {/* Header */}
      <header className="vs-header">
        <span className="vs-header-title">🗳️ LASA SecureVote</span>
        <div className="vs-header-actions">
          <span className="vs-badge">{currentUser.name}</span>
          {currentUser.role === "admin" && (
            <button
              className={`vs-btn ${electionOpen ? "vs-btn-danger" : "vs-btn-success"}`}
              onClick={() => setElectionOpen((o) => !o)}
            >
              {electionOpen ? "Close Election" : "Open Election"}
            </button>
          )}
          <button className="vs-btn vs-btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="vs-tabs">
        {["dashboard", "vote", "results", "audit",
          ...(currentUser.role === "admin" ? ["admin"] : [])
        ].map((t) => (
          <button
            key={t}
            className={`vs-tab ${tab === t ? "vs-tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="vs-main">

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="vs-section">
            <h2>Welcome, {currentUser.name}</h2>
            <p>
              Election status:{" "}
              <strong style={{ color: electionOpen ? "#16A34A" : "#DC2626" }}>
                {electionOpen ? "Open" : "Closed"}
              </strong>
            </p>
            <p>Total candidates: {candidates.length}</p>
            <p>Total votes cast: {totalVotes}</p>

            {voteSuccess && (
              <div className="vs-alert vs-alert-success">
                ✅ Your vote has been recorded. Thank you for participating!
              </div>
            )}
            {!voteSuccess && electionOpen && (
              <button
                className="vs-btn vs-btn-primary"
                onClick={() => setTab("vote")}
              >
                Cast Your Vote →
              </button>
            )}
          </div>
        )}

        {/* VOTE */}
        {tab === "vote" && (
          <div className="vs-section">
            <h2>Cast Your Vote</h2>
            {!electionOpen && (
              <div className="vs-alert vs-alert-warning">
                The election is currently closed.
              </div>
            )}
            {voteSuccess && (
              <div className="vs-alert vs-alert-success">
                ✅ You have already voted. Thank you!
              </div>
            )}
            {electionOpen && !voteSuccess && (
              <div className="vs-candidates-grid">
                {candidates.map((c) => (
                  <div key={c.id} className="vs-candidate-card">
                    <div className="vs-candidate-name">{c.name}</div>
                    <div className="vs-candidate-party">{c.party}</div>
                    <button
                      className="vs-btn vs-btn-primary"
                      onClick={() => {
                        setSelectedCand(c);
                        setVoteModal(true);
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESULTS */}
        {tab === "results" && (
          <div className="vs-section">
            <h2>Live Results</h2>
            <p style={{ color: "#6B7280" }}>Total votes cast: {totalVotes}</p>
            {candidates.map((c) => {
              const pct = totalVotes > 0
                ? Math.round((c.votes / totalVotes) * 100)
                : 0;
              return (
                <div key={c.id} className="vs-result-row">
                  <div className="vs-result-label">
                    <span>{c.name}</span>
                    <span>{c.votes} vote{c.votes !== 1 ? "s" : ""} ({pct}%)</span>
                  </div>
                  <div className="vs-result-bar-track">
                    <div
                      className="vs-result-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <button
              className="vs-btn vs-btn-outline"
              style={{ marginTop: "16px" }}
              onClick={loadCandidates}
            >
              🔄 Refresh Results
            </button>
          </div>
        )}

        {/* AUDIT */}
        {tab === "audit" && (
          <div className="vs-section">
            <h2>Audit Log</h2>
            {auditLog.length === 0 ? (
              <p style={{ color: "#9CA3AF" }}>No events recorded this session.</p>
            ) : (
              <ul className="vs-audit-list">
                {auditLog.map((entry, i) => (
                  <li key={i} style={{ fontFamily: "monospace", fontSize: "13px" }}>
                    {entry}
                  </li>
                ))}
              </ul>
            )}
            {auditLog.length > 0 && (
              <button
                className="vs-btn vs-btn-outline"
                style={{ marginTop: "12px" }}
                onClick={() =>
                  exportCSV(auditLog.map((e) => [e]), "lasa_audit_log.csv")
                }
              >
                Export CSV
              </button>
            )}
          </div>
        )}
        {/* ADMIN — voter management */}
        {tab === "admin" && currentUser.role === "admin" && (
          <div className="vs-section">
            <h2>Voter Management</h2>
            <p style={{ color: "#6B7280", marginBottom: "16px" }}>
              Register new voters directly into the database. Each voter gets
              a unique Voter ID and can log in immediately with their email + PIN.
            </p>

            {voterAlert && (
              <div className={`vs-alert vs-alert-${voterAlert.type}`}>
                {voterAlert.msg}
              </div>
            )}

            <div className="vs-form-group">
              <label className="vs-label">Full Name</label>
              <input
                className="vs-input"
                value={voterForm.name}
                onChange={(e) => setVoterForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. JOHN DOE"
              />
            </div>

            <div className="vs-form-group">
              <label className="vs-label">Email address</label>
              <input
                className="vs-input"
                type="email"
                value={voterForm.email}
                onChange={(e) => setVoterForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="voter@example.com"
              />
            </div>

            <div className="vs-form-group" style={{ maxWidth: "220px" }}>
              <label className="vs-label">PIN (4-8 characters)</label>
              <input
                className="vs-input"
                value={voterForm.pin}
                onChange={(e) => setVoterForm((p) => ({ ...p, pin: e.target.value }))}
                placeholder="e.g. 1234"
                maxLength={8}
              />
            </div>

            <button
              className="vs-btn vs-btn-primary"
              disabled={addingVoter}
              onClick={handleAddVoter}
            >
              {addingVoter ? "Registering…" : "➕ Register Voter"}
            </button>

            <div className="vs-divider" style={{ margin: "24px 0" }} />

            <div className="vs-flex-between vs-mb">
              <h3 style={{ margin: 0 }}>Registered Voters ({voters.length})</h3>
              <button className="vs-btn vs-btn-outline" onClick={loadVoters}>
                🔄 Refresh
              </button>
            </div>

            <table className="vs-table">
              <thead>
                <tr>
                  <th>Voter ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {voters.map((v) => (
                  <tr key={v.voter_id}>
                    <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{v.voter_id}</td>
                    <td>{v.name}</td>
                    <td>{v.email}</td>
                    <td>
                      {v.voted
                        ? <span className="vs-badge vs-badge-green">✓ Voted</span>
                        : <span className="vs-badge vs-badge-blue">Pending</span>}
                    </td>
                    <td>
                      <button
                        className="vs-btn vs-btn-danger"
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                        disabled={!!v.voted}
                        onClick={() => handleRemoveVoter(v.voter_id, v.name)}
                        title={v.voted ? "Cannot remove a voter who has already voted" : "Remove voter"}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {voters.length === 0 && (
              <p style={{ color: "#9CA3AF", marginTop: "12px" }}>No voters registered yet.</p>
            )}
          </div>
        )}
      </main>

      {/* Vote Confirmation Modal */}
      {voteModal && selectedCand && (
        <div className="vs-modal-overlay">
          <div className="vs-modal">
            <h3>Confirm Your Vote</h3>
            <p>
              You are voting for <strong>{selectedCand.name}</strong>
              {selectedCand.party ? ` — ${selectedCand.party}` : ""}.
            </p>
            <p style={{ color: "#DC2626", fontSize: "13px" }}>
              ⚠️ This action cannot be undone.
            </p>
            <div className="vs-modal-actions">
              <button
                className="vs-btn vs-btn-primary"
                disabled={loading}
                onClick={() => handleVote(selectedCand.id)}
              >
                {loading ? "Submitting…" : "Confirm Vote ✓"}
              </button>
              <button
                className="vs-btn vs-btn-outline"
                onClick={() => {
                  setVoteModal(false);
                  setSelectedCand(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="vs-loading-overlay">
          <div className="vs-spinner" />
        </div>
      )}
    </div>
  );
}