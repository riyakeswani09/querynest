import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QuestionForm from "../components/QuestionForm";
import QuestionCard from "../components/QuestionCard";
import LiveStats from "../components/LiveStats";
import {
  subscribeToQuestions,
  subscribeToSession,
  updateStudentCount,
} from "../firebase/firestore";
import "../styles/student.css";

function SkeletonCard() {
  return <div className="skeleton-card" />;
}

export default function StudentView() {
  const { sessionId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [sessionData, setSessionData] = useState({
    studentCount: 0,
    questionCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // ✅ student tracking
  useEffect(() => {
    if (!sessionId) return;

    updateStudentCount(sessionId, 1);

    return () => {
      updateStudentCount(sessionId, -1);
    };
  }, [sessionId]);

  // ✅ realtime listeners
  useEffect(() => {
    if (!sessionId) return;

    const unsubQ = subscribeToQuestions(sessionId, (qs) => {
      setQuestions(qs);
      setLoading(false);
    });

    const unsubS = subscribeToSession(sessionId, (data) => {
      setSessionData({
        studentCount: data?.studentCount ?? 0,
        questionCount: data?.questionCount ?? 0,
      });
    });

    return () => {
      if (typeof unsubQ === "function") unsubQ();
      if (typeof unsubS === "function") unsubS();
    };
  }, [sessionId]);

  // 🔥 SORTED QUESTIONS (NEW FEATURE)
  const sortedQuestions = [...questions].sort((a, b) => {
    const aScore =
      (a.reactions?.heart || 0) +
      (a.reactions?.fire || 0) * 2 +
      (a.reactions?.thumbs || 0);

    const bScore =
      (b.reactions?.heart || 0) +
      (b.reactions?.fire || 0) * 2 +
      (b.reactions?.thumbs || 0);

    return bScore - aScore;
  });

  return (
    <div className="student-page">
      <header className="student-header">
        <div className="header-left">
          <span className="logo-sm">🪺</span>
          <div>
            <h1>QueryNest</h1>
            <span className="session-badge">
              Session: {sessionId}
            </span>
          </div>
        </div>

        <LiveStats
          studentCount={sessionData.studentCount}
          questionCount={sessionData.questionCount}
        />
      </header>

      <main className="student-main">
        {sessionId && <QuestionForm sessionId={sessionId} />}

        <section className="questions-section">
          <h2>Live Questions</h2>

          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : questions.length === 0 ? (
            <p className="empty-state">
              No questions yet — be the first to ask! 🙋
            </p>
          ) : (
            <div className="questions-list">
              {sortedQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isStudent={true}
                  sessionId={sessionId}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}