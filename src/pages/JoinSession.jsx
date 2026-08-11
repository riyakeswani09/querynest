import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../firebase/firestore";

export default function JoinSession() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ---------------- JOIN AS STUDENT ----------------
  async function handleJoin(e) {
    e.preventDefault();

    const trimmed = code.trim().toUpperCase();

    if (!trimmed) {
      setError("Please enter a session code");
      return;
    }

    setError("");

    // IMPORTANT: navigate safely
    navigate("/student/" + trimmed);
  }

  // ---------------- CREATE SESSION (LECTURER) ----------------
  async function handleCreateSession() {
  setLoading(true);

  try {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    console.log("Creating session:", newCode);

    await createSession(newCode);

    console.log("SUCCESS");

    navigate('/lecturer/' + newCode);

  } catch (err) {
    console.error("CREATE SESSION ERROR:", err);
    alert(err.message);
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="join-page">
      <div className="join-card">
        <div className="join-logo">🪺</div>

        <h1>QueryNest</h1>
        <p className="join-subtitle">
          Anonymous live Q&A for guest lectures
        </p>

        {error && <div className="error-toast">⚠️ {error}</div>}

        {/* ---------------- STUDENT JOIN ---------------- */}
        <form onSubmit={handleJoin} className="join-form">
          <label htmlFor="code-input">Enter session code</label>

          <input
            id="code-input"
            type="text"
            placeholder="e.g. AB12CD"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase())
            }
            maxLength={8}
            autoComplete="off"
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={!code.trim()}
          >
            Join as Student
          </button>
        </form>

        <div className="join-divider">
          <span>or</span>
        </div>

        {/* ---------------- LECTURER CREATE ---------------- */}
        <button
          onClick={handleCreateSession}
          className="btn-secondary"
          disabled={loading}
        >
          {loading
            ? "Creating session..."
            : "Create a new session (Lecturer)"}
        </button>
      </div>
    </div>
  );
}