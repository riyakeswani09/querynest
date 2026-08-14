import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import QuestionForm from '../components/QuestionForm'
import QuestionCard from '../components/QuestionCard'
import LiveStats from '../components/LiveStats'
import TopReactions from '../components/TopReactions'

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

  const [questions, setQuestions] = useState([])

  const [sessionData, setSessionData] = useState({
    studentCount: 0,
    questionCount: 0,
  })

  const [loading, setLoading] = useState(true)

  // =====================================================
  // SORT QUESTIONS BY TOTAL REACTIONS
  // MOST REACTED QUESTION FIRST
  // =====================================================

  const sortedQuestions = [...questions].sort((a, b) => {
    const reactionsA =
      (a.reactions?.heart ?? 0) +
      (a.reactions?.fire ?? 0) +
      (a.reactions?.thumbs ?? 0)

    const reactionsB =
      (b.reactions?.heart ?? 0) +
      (b.reactions?.fire ?? 0) +
      (b.reactions?.thumbs ?? 0)

    return reactionsB - reactionsA
  })

  // =====================================================
  // STUDENT COUNT
  // =====================================================

  useEffect(() => {
    if (!sessionId) return

    const countKey = `joined_${sessionId}`

    const alreadyCounted =
      sessionStorage.getItem(countKey)

    if (!alreadyCounted) {
      updateStudentCount(sessionId, 1)
        .then(() => {
          sessionStorage.setItem(
            countKey,
            '1'
          )
        })
        .catch((error) => {
          console.error(
            '❌ Failed to update student count:',
            error
          )
        })
    }
  }, [sessionId])

  // =====================================================
  // REALTIME QUESTIONS + SESSION
  // =====================================================

  useEffect(() => {
    if (!sessionId) return

    setLoading(true)

    const unsubscribeQuestions =
      subscribeToQuestions(
        sessionId,
        (qs) => {
          console.log(
            '🔥 Student received questions:',
            qs
          )

          setQuestions(qs)
          setLoading(false)
        }
      )

    const unsubscribeSession =
      subscribeToSession(
        sessionId,
        (data) => {
          console.log(
            '📊 Student session data:',
            data
          )

          setSessionData(
            data || {
              studentCount: 0,
              questionCount: 0,
            }
          )
        }
      )

    return () => {
      if (unsubscribeQuestions) {
        unsubscribeQuestions()
      }

      if (unsubscribeSession) {
        unsubscribeSession()
      }
    }
  }, [sessionId])

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="student-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="student-header">

        {/* LOGO */}

        <div className="header-left">

          <span className="logo-sm">
            🪺
          </span>

          <div>
            <h1>
              QueryNest
            </h1>
          </div>

        </div>

        {/* =================================================
            SESSION ID
        ================================================= */}

        <div className="session-display">

          <span className="session-label">
            SESSION ID
          </span>

          <strong>
            {sessionId || '------'}
          </strong>

        </div>

        {/* =================================================
            LIVE STATS
        ================================================= */}

        <LiveStats
          studentCount={
            sessionData.studentCount ?? 0
          }
          questionCount={
            sessionData.questionCount ?? 0
          }
        />

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="student-main">

        {/* =================================================
            TOP REACTIONS
        ================================================= */}

        <TopReactions
          questions={questions}
        />

        {/* =================================================
            QUESTION FORM
        ================================================= */}

        <QuestionForm
          sessionId={sessionId}
        />

        {/* =================================================
            QUESTIONS
        ================================================= */}

        <section className="questions-section">

          <h2>
            Live Questions
          </h2>

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

              {/* MOST REACTED QUESTION FIRST */}

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
  )
}