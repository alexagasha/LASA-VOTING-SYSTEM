const API = "http://localhost:3001/api";

export const getVoters = async () => {
  const res = await fetch(`${API}/voters`);
  return res.json();
};

export const getCandidates = async () => {
  const res = await fetch(`${API}/candidates`);
  return res.json();
};

export const castVote = async (data) => {
  const res = await fetch(`${API}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
};