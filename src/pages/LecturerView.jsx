import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QuestionCard from '../components/QuestionCard'
import LiveStats from '../components/LiveStats'
import SpeechPanel from '../components/SpeechPanel'
import {
  subscribeToQuestions,
  subscribeToSession,
  markAnswered,
  toggleHighlight,
} from '../firebase/firestore'
import '../styles/lecturer.css'

export default function LecturerView() {
  const { sessionId } = useParams()
  const [questions, setQuestions]     = useState([])
  const [sessionData, setSessionData] = useState({ studentCount: 0, questionCount: 0 })

  useEffect(() => {
    const unsubQ = subscribeToQuestions(sessionId, setQuestions)
    const unsubS = subscribeToSession(sessionId, setSessionData)
    return () => { unsubQ(); unsubS() }
  }, [sessionId])

  async function handleMarkAnswered(questionId) {
    await markAnswered(sessionId, questionId)
  }

  async function handleToggleHighlight(questionId, current) {
    await toggleHighlight(sessionId, questionId, current)
  }

  const unanswered          = questions.filter(q => !q.answered)
  const answered            = questions.filter(q => q.answered)

  // ← THIS LINE WAS MISSING — finds the currently highlighted question
  const highlightedQuestion = questions.find(q => q.highlighted && !q.answered) || null

  return (
    <div className="lecturer-page">
      <header className="lecturer-header">
        <div className="header-left">
          <span className="logo-sm">🪺</span>
          <div>
            <h1>QueryNest — Lecturer View</h1>
            <span className="session-badge">Session: {sessionId}</span>
          </div>
        </div>
        <LiveStats
          studentCount={sessionData.studentCount ?? 0}
          questionCount={sessionData.questionCount ?? 0}
        />
      </header>

      <main className="lecturer-main">

        {/* ← THIS BLOCK WAS MISSING — renders the Speech Panel */}
        {/* Was: <SpeechPanel highlightedQuestion={highlightedQuestion} /> */}
{/* Now: */}
        <SpeechPanel highlightedQuestion={highlightedQuestion} sessionId={sessionId} />
        

        <div className="lecturer-columns">

          {/* ── Queue column ── */}
          <section className="queue-section">
            <h2>
              Question Queue
              <span className="count-badge">{unanswered.length}</span>
            </h2>
            <div className="questions-list">
              {unanswered.length === 0 && (
                <p className="empty-state">No pending questions yet.</p>
              )}
              {unanswered.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isStudent={false}
                  sessionId={sessionId}
                  onMarkAnswered={handleMarkAnswered}
                  onToggleHighlight={handleToggleHighlight}
                />
              ))}
            </div>
          </section>

          {/* ── Answered column ── */}
          <section className="answered-section">
            <h2>
              Answered
              <span className="count-badge answered">{answered.length}</span>
            </h2>
            <div className="questions-list">
              {answered.length === 0 && (
                <p className="empty-state">No answered questions yet.</p>
              )}
              {answered.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isStudent={false}
                  sessionId={sessionId}
                  onMarkAnswered={handleMarkAnswered}
                  onToggleHighlight={handleToggleHighlight}
                />
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}