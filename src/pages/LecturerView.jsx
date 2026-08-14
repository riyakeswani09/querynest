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

  const [questions, setQuestions] = useState([])

  const [sessionData, setSessionData] = useState({
    studentCount: 0,
    questionCount: 0,
  })

  // =====================================================
  // REALTIME FIREBASE DATA
  // =====================================================

  useEffect(() => {
    console.log('🎓 Lecturer View loaded')
    console.log('📌 Lecturer sessionId:', sessionId)

    if (!sessionId) {
      console.error('❌ No sessionId found in URL')
      return
    }

    // ---------------- QUESTIONS ----------------

    const unsubscribeQuestions =
      subscribeToQuestions(
        sessionId,
        (newQuestions) => {
          console.log(
            '🔥 Lecturer received questions:',
            newQuestions
          )

          setQuestions(newQuestions)
        }
      )

    // ---------------- SESSION ----------------

    const unsubscribeSession =
      subscribeToSession(
        sessionId,
        (data) => {
          console.log(
            '📊 Lecturer session data:',
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

    // ---------------- CLEANUP ----------------

    return () => {
      console.log(
        '🧹 Cleaning lecturer subscriptions'
      )

      if (unsubscribeQuestions) {
        unsubscribeQuestions()
      }

      if (unsubscribeSession) {
        unsubscribeSession()
      }
    }
  }, [sessionId])

  // =====================================================
  // MARK ANSWERED
  // =====================================================

  async function handleMarkAnswered(questionId) {
    try {
      console.log(
        '✅ Marking answered:',
        questionId
      )

      await markAnswered(
        sessionId,
        questionId
      )
    } catch (error) {
      console.error(
        '❌ Failed to mark question answered:',
        error
      )
    }
  }

  // =====================================================
  // TOGGLE HIGHLIGHT
  // =====================================================

  async function handleToggleHighlight(
    questionId,
    current
  ) {
    try {
      console.log(
        '⭐ Toggle highlight:',
        questionId,
        'Current:',
        current
      )

      await toggleHighlight(
        sessionId,
        questionId,
        current
      )
    } catch (error) {
      console.error(
        '❌ Failed to toggle highlight:',
        error
      )
    }
  }

  // =====================================================
  // SEPARATE ANSWERED / UNANSWERED
  // =====================================================

  const unanswered = questions.filter(
    (question) => !question.answered
  )

  const answered = questions.filter(
    (question) => question.answered
  )

  // =====================================================
  // SORT BY TOTAL REACTIONS
  // MOST REACTED QUESTION FIRST
  // =====================================================

  const sortedUnanswered = [...unanswered].sort(
    (a, b) => {
      const reactionsA =
        (a.reactions?.heart ?? 0) +
        (a.reactions?.fire ?? 0) +
        (a.reactions?.thumbs ?? 0)

      const reactionsB =
        (b.reactions?.heart ?? 0) +
        (b.reactions?.fire ?? 0) +
        (b.reactions?.thumbs ?? 0)

      return reactionsB - reactionsA
    }
  )

  const sortedAnswered = [...answered].sort(
    (a, b) => {
      const reactionsA =
        (a.reactions?.heart ?? 0) +
        (a.reactions?.fire ?? 0) +
        (a.reactions?.thumbs ?? 0)

      const reactionsB =
        (b.reactions?.heart ?? 0) +
        (b.reactions?.fire ?? 0) +
        (b.reactions?.thumbs ?? 0)

      return reactionsB - reactionsA
    }
  )

  // =====================================================
  // CURRENT HIGHLIGHTED QUESTION
  // =====================================================

  const highlightedQuestion =
    questions.find(
      (question) =>
        question.highlighted &&
        !question.answered
    ) || null

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="lecturer-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="lecturer-header">

        <div className="header-left">

          <span className="logo-sm">
            🪺
          </span>

          <div>

            <h1>
              QueryNest — Lecturer View
            </h1>

            <span className="session-badge">
              Session:{' '}
              {sessionId || 'Loading...'}
            </span>

          </div>

        </div>

        {/* LIVE STATS */}

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

      <main className="lecturer-main">

        {/* =================================================
            SESSION ID
        ================================================= */}

        <div className="session-display lecturer-session-display">

          <span className="session-label">
            SESSION ID
          </span>

          <strong>
            {sessionId || '------'}
          </strong>

        </div>

        {/* =================================================
            SPEECH PANEL
        ================================================= */}

        <SpeechPanel
          highlightedQuestion={
            highlightedQuestion
          }
          sessionId={sessionId}
        />

        {/* =================================================
            QUESTION COLUMNS
        ================================================= */}

        <div className="lecturer-columns">

          {/* =================================================
              QUESTION QUEUE
          ================================================= */}

          <section className="queue-section">

            <h2>

              Question Queue

              <span className="count-badge">
                {unanswered.length}
              </span>

            </h2>

            <div className="questions-list">

              {sortedUnanswered.length === 0 && (
                <p className="empty-state">
                  No pending questions yet.
                </p>
              )}

              {sortedUnanswered.map(
                (question) => (

                  <QuestionCard
                    key={question.id}
                    question={question}
                    isStudent={false}
                    sessionId={sessionId}
                    onMarkAnswered={
                      handleMarkAnswered
                    }
                    onToggleHighlight={
                      handleToggleHighlight
                    }
                  />

                )
              )}

            </div>

          </section>

          {/* =================================================
              ANSWERED QUESTIONS
          ================================================= */}

          <section className="answered-section">

            <h2>

              Answered

              <span className="count-badge answered">
                {answered.length}
              </span>

            </h2>

            <div className="questions-list">

              {sortedAnswered.length === 0 && (
                <p className="empty-state">
                  No answered questions yet.
                </p>
              )}

              {sortedAnswered.map(
                (question) => (

                  <QuestionCard
                    key={question.id}
                    question={question}
                    isStudent={false}
                    sessionId={sessionId}
                    onMarkAnswered={
                      handleMarkAnswered
                    }
                    onToggleHighlight={
                      handleToggleHighlight
                    }
                  />

                )
              )}

            </div>

          </section>

        </div>

      </main>

    </div>
  )
}