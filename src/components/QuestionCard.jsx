import { useState, useEffect, useRef } from 'react'
import { addReaction } from '../firebase/firestore'

export default function QuestionCard({
  question,
  isStudent,
  sessionId,
  onMarkAnswered,
  onToggleHighlight,
}) {
  const { id, text, reactions, answered, highlighted, liveTranscript, isAnswering } = question

  const [reacted, setReacted] = useState({ heart: false, fire: false, thumbs: false })
  const transcriptRef = useRef(null)

  useEffect(() => {
    setReacted({
      heart:  !!localStorage.getItem(`reacted_${id}_heart`),
      fire:   !!localStorage.getItem(`reacted_${id}_fire`),
      thumbs: !!localStorage.getItem(`reacted_${id}_thumbs`),
    })
  }, [id])

  // Auto-scroll live transcript on student side
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [liveTranscript])

  async function handleReaction(type) {
    if (!isStudent || reacted[type] || answered) return
    localStorage.setItem(`reacted_${id}_${type}`, '1')
    setReacted(prev => ({ ...prev, [type]: true }))
    await addReaction(sessionId, id, type)
  }

  const REACTIONS = [
    { type: 'heart',  emoji: '❤️', count: reactions?.heart  ?? 0 },
    { type: 'fire',   emoji: '🔥', count: reactions?.fire   ?? 0 },
    { type: 'thumbs', emoji: '👍', count: reactions?.thumbs ?? 0 },
  ]

  return (
    <div className={`question-card ${answered ? 'answered' : ''} ${highlighted ? 'highlighted' : ''}`}>

      {highlighted && !answered && <span className="highlighted-tag">⭐ Current Question</span>}
      {answered && <span className="answered-tag">✓ Answered</span>}

      <p className="question-text">{text}</p>

      {/* ── Live answering indicator (students see this) ── */}
      {isAnswering && isStudent && (
        <div className="live-answer-indicator">
          <span className="live-answer-dot" />
          🎤 Lecturer is answering...
        </div>
      )}

      {/* ── Live transcript while answering ── */}
      {isAnswering && liveTranscript && (
        <div
          className="live-transcript-box"
          ref={transcriptRef}
        >
          <span className="live-transcript-label">Live answer:</span>
          <p className="live-transcript-text">{liveTranscript}</p>
        </div>
      )}

      {/* ── Final answer (after marked answered) ── */}
      {answered && liveTranscript && (
        <div className="final-answer-box">
          <span className="final-answer-label">📝 Lecturer's answer:</span>
          <p className="final-answer-text">{liveTranscript}</p>
        </div>
      )}

      <div className="question-footer">
        <div className="reactions">
          {REACTIONS.map(({ type, emoji, count }) =>
            isStudent ? (
              <button
                key={type}
                className={`reaction-btn ${reacted[type] ? 'reacted' : ''}`}
                onClick={() => handleReaction(type)}
                disabled={reacted[type] || answered}
                title={reacted[type] ? 'Already reacted' : `React with ${emoji}`}
              >
                {emoji} <span className="reaction-count">{count}</span>
              </button>
            ) : (
              <span key={type} className="reaction">{emoji} {count}</span>
            )
          )}
        </div>

        {!isStudent && !answered && (
          <div className="lecturer-actions">
            <button
              className={`highlight-btn ${highlighted ? 'active' : ''}`}
              onClick={() => onToggleHighlight && onToggleHighlight(id, highlighted)}
            >
              {highlighted ? '★ Highlighted' : '☆ Highlight'}
            </button>
            <button
              className="mark-answered-btn"
              onClick={() => onMarkAnswered && onMarkAnswered(id)}
            >
              ✓ Answered
            </button>
          </div>
        )}
      </div>
    </div>
  )
}