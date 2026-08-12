import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QuestionForm from '../components/QuestionForm'
import QuestionCard from '../components/QuestionCard'
import LiveStats from '../components/LiveStats'
import {
  subscribeToQuestions,
  subscribeToSession,
  updateStudentCount,
} from '../firebase/firestore'
import '../styles/student.css'

function SkeletonCard() {
  return <div className="skeleton-card" />
}

export default function StudentView() {
  const { sessionId } = useParams()
  const [questions, setQuestions]     = useState([])
  const [sessionData, setSessionData] = useState({ studentCount: 0, questionCount: 0 })
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    // Use sessionStorage to track if this tab already counted
    // sessionStorage clears when tab is closed but persists on reload
    const countKey = `joined_${sessionId}`
    const alreadyCounted = sessionStorage.getItem(countKey)

    if (!alreadyCounted) {
      // First time this tab joins — increment
      updateStudentCount(sessionId, 1)
      sessionStorage.setItem(countKey, '1')
    }

    // Decrement when tab is actually closed (not on reload)
    const handleUnload = () => {
      // Only decrement if this tab was counted
      if (sessionStorage.getItem(countKey)) {
        updateStudentCount(sessionId, -1)
        sessionStorage.removeItem(countKey)
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [sessionId])

  useEffect(() => {
    const unsubQ = subscribeToQuestions(sessionId, (qs) => {
      setQuestions(qs)
      setLoading(false)
    })
    const unsubS = subscribeToSession(sessionId, setSessionData)
    return () => { unsubQ(); unsubS() }
  }, [sessionId])

  return (
    <div className="student-page">
      <header className="student-header">
        <div className="header-left">
          <span className="logo-sm">🪺</span>
          <div>
            <h1>QueryNest</h1>
            <span className="session-badge">Session: {sessionId}</span>
          </div>
        </div>
        <LiveStats
          studentCount={sessionData.studentCount ?? 0}
          questionCount={sessionData.questionCount ?? 0}
        />
      </header>

      <main className="student-main">
        <QuestionForm sessionId={sessionId} />

        <section className="questions-section">
          <h2>Live Questions</h2>

          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : questions.length === 0 ? (
            <p className="empty-state">No questions yet — be the first to ask! 🙋</p>
          ) : (
            <div className="questions-list">
              {questions.map(q => (
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
  )
}