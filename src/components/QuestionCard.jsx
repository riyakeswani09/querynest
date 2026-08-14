import { useState, useEffect } from 'react'
import {
  addReaction,
  removeReaction,
} from '../firebase/firestore'

export default function QuestionCard({
  question,
  isStudent,
  sessionId,
  onMarkAnswered,
  onToggleHighlight,
}) {
  const {
    id,
    text,
    reactions,
    answered,
    highlighted,
    liveTranscript,
    isAnswering,
  } = question

  const [reacted, setReacted] = useState({
    heart: false,
    fire: false,
    thumbs: false,
  })

  // Check which reactions this student has already made
  useEffect(() => {
    setReacted({
      heart: !!localStorage.getItem(`reacted_${id}_heart`),
      fire: !!localStorage.getItem(`reacted_${id}_fire`),
      thumbs: !!localStorage.getItem(`reacted_${id}_thumbs`),
    })
  }, [id])

  // ---------------- REACTIONS ----------------

  async function handleReaction(type) {
    // Students are allowed to react whether the question
    // is answered or unanswered.
    if (!isStudent) return

    const alreadyReacted = reacted[type]
    const storageKey = `reacted_${id}_${type}`

    try {
      if (alreadyReacted) {
        // ---------------- REMOVE REACTION ----------------

        localStorage.removeItem(storageKey)

        setReacted((prev) => ({
          ...prev,
          [type]: false,
        }))

        await removeReaction(
          sessionId,
          id,
          type
        )
      } else {
        // ---------------- ADD REACTION ----------------

        localStorage.setItem(storageKey, '1')

        setReacted((prev) => ({
          ...prev,
          [type]: true,
        }))

        await addReaction(
          sessionId,
          id,
          type
        )
      }
    } catch (error) {
      console.error('Reaction error:', error)

      // Roll back local state if Firebase fails
      if (alreadyReacted) {
        localStorage.setItem(
          storageKey,
          '1'
        )
      } else {
        localStorage.removeItem(
          storageKey
        )
      }

      setReacted((prev) => ({
        ...prev,
        [type]: alreadyReacted,
      }))
    }
  }

  // ---------------- REACTION DATA ----------------

  const REACTIONS = [
    {
      type: 'heart',
      emoji: '❤️',
      count: reactions?.heart ?? 0,
    },
    {
      type: 'fire',
      emoji: '🔥',
      count: reactions?.fire ?? 0,
    },
    {
      type: 'thumbs',
      emoji: '👍',
      count: reactions?.thumbs ?? 0,
    },
  ]

  // ---------------- UI ----------------

  return (
    <div
      className={`question-card ${
        answered ? 'answered' : ''
      } ${
        highlighted ? 'highlighted' : ''
      }`}
    >

      {/* Highlighted label */}
      {highlighted && !answered && (
        <span className="highlighted-tag">
          ⭐ Current Question
        </span>
      )}

      {/* Answered label */}
      {answered && (
        <span className="answered-tag">
          ✓ Answered
        </span>
      )}

      {/* Question */}
      <p className="question-text">
        {text}
      </p>

      {/* Live answering indicator */}
      {isAnswering && isStudent && (
        <div className="live-answer-indicator">
          <span className="live-answer-dot" />
          🎤 Lecturer is answering...
        </div>
      )}

      {/* Live transcript */}
      {isAnswering && liveTranscript && (
        <div className="live-transcript-box">
          <span className="live-transcript-label">
            Live answer:
          </span>

          <p className="live-transcript-text">
            {liveTranscript}
          </p>
        </div>
      )}

      {/* Final answer */}
      {answered && liveTranscript && (
        <div className="final-answer-box">
          <span className="final-answer-label">
            📝 Lecturer answer:
          </span>

          <p className="final-answer-text">
            {liveTranscript}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="question-footer">

        {/* ---------------- REACTIONS ---------------- */}

        <div className="reactions">

          {REACTIONS.map(
            ({ type, emoji, count }) =>
              isStudent ? (

                <button
                  key={type}
                  type="button"
                  className={`reaction-btn ${
                    reacted[type]
                      ? 'reacted'
                      : ''
                  }`}
                  onClick={() =>
                    handleReaction(type)
                  }
                  title={
                    reacted[type]
                      ? `Remove ${emoji} reaction`
                      : `React with ${emoji}`
                  }
                >
                  {emoji}

                  <span className="reaction-count">
                    {count}
                  </span>

                  {/* Show X when student has reacted */}
                  {reacted[type] && (
                    <span className="reaction-undo">
                      ✕
                    </span>
                  )}
                </button>

              ) : (

                // Lecturer sees reaction counts only
                <span
                  key={type}
                  className="reaction"
                >
                  {emoji} {count}
                </span>

              )
          )}

        </div>

        {/* ---------------- LECTURER CONTROLS ---------------- */}

        {!isStudent && !answered && (
          <div className="lecturer-actions">

            {/* Highlight */}
            <button
              type="button"
              className={`highlight-btn ${
                highlighted
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                onToggleHighlight &&
                onToggleHighlight(
                  id,
                  highlighted
                )
              }
            >
              {highlighted
                ? '★ Highlighted'
                : '☆ Highlight'}
            </button>

            {/* Mark answered */}
            <button
              type="button"
              className="mark-answered-btn"
              onClick={() =>
                onMarkAnswered &&
                onMarkAnswered(id)
              }
            >
              ✓ Answered
            </button>

          </div>
        )}

      </div>
    </div>
  )
}