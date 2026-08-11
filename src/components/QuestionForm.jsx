import { useState } from "react";
import { submitQuestion } from "../firebase/firestore";

export default function QuestionForm({ sessionId }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) return;

    // ✅ Safety check (prevents stuck submit)
    if (!sessionId) {
      setError("Session not found. Please rejoin the session.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await submitQuestion(sessionId, trimmed);

      setText("");
      setSubmitted(true);

      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit question. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="question-form-wrap">
      <h2>Ask a question</h2>
      <p className="anon-note">🔒 You are completely anonymous</p>

      {submitted && (
        <div className="success-toast">
          ✅ Your question was submitted!
        </div>
      )}

      {error && (
        <div className="error-toast">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="question-form">
        <textarea
          placeholder="Type your question here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={300}
          disabled={loading}
        />

        <div className="form-footer">
          <span className="char-count">
            {text.length}/300
          </span>

          <button
            type="submit"
            className="btn-primary"
            disabled={!text.trim() || loading}
          >
            {loading ? "Submitting..." : "Submit anonymously"}
          </button>
        </div>
      </form>
    </div>
  );
}