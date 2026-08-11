import { useState, useEffect, useRef } from 'react'
import { updateLiveTranscript, saveAnswer, toggleHighlight } from '../firebase/firestore'

export default function SpeechPanel({ highlightedQuestion, sessionId }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript]   = useState('')
  const [supported, setSupported]     = useState(true)
  const [error, setError]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [manualMode, setManualMode]   = useState(false)
  const recognitionRef                = useRef(null)
  const transcriptBoxRef              = useRef(null)
  const transcriptRef                 = useRef('')  // always-current value for async callbacks

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setSupported(false)
      setManualMode(true)
    }
  }, [])

  // Keep ref in sync with state for use inside recognition callbacks
  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  // Auto-scroll transcript box
  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight
    }
  }, [transcript])

  // Reset transcript when highlighted question changes
  useEffect(() => {
    setTranscript('')
    transcriptRef.current = ''
    setError('')
    if (isListening) stopListening()
  }, [highlightedQuestion?.id])

  async function pushTranscript(text) {
    if (!highlightedQuestion) return
    try {
      await updateLiveTranscript(sessionId, highlightedQuestion.id, text)
    } catch (e) {
      console.error('Transcript sync error:', e)
    }
  }

  function startListening() {
    if (!highlightedQuestion) {
      setError('Please highlight a question first before starting.')
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous     = true
    recognition.interimResults = true
    recognition.lang           = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setError('')
    }

    recognition.onresult = (event) => {
      let full = ''
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript
      }
      setTranscript(full)
      transcriptRef.current = full
      // Push to Firestore every result (debounced by browser)
      pushTranscript(full)
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone in your browser settings.')
      } else if (event.error === 'no-speech') {
        // Silence — ignore, will auto-restart
      } else if (event.error === 'network') {
        setError('Network error. Check your internet connection.')
      } else {
        setError(`Speech error: ${event.error}`)
      }
      if (event.error !== 'no-speech') setIsListening(false)
    }

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current) {
        try { recognitionRef.current.start() } catch (e) {}
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }

  async function handleFinishAnswer() {
    if (!highlightedQuestion) return
    stopListening()
    setSaving(true)
    try {
      await saveAnswer(sessionId, highlightedQuestion.id, transcriptRef.current)
      setTranscript('')
      transcriptRef.current = ''
    } catch (e) {
      setError('Failed to save answer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleManualSubmit() {
    if (!highlightedQuestion || !transcript.trim()) return
    setSaving(true)
    try {
      await saveAnswer(sessionId, highlightedQuestion.id, transcript.trim())
      setTranscript('')
    } catch (e) {
      setError('Failed to save answer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Unsupported — show manual input ──
  if (!supported) {
    return (
      <div className="speech-panel">
        <div className="speech-header">
          <div className="speech-title-row">
            <span className="speech-icon">🎤</span>
            <span className="speech-title">Answer Question</span>
          </div>
          <span className="speech-status off">Type Mode</span>
        </div>

        <div className="speech-unsupported-note">
          ⚠️ Speech recognition unavailable in this browser. Type your answer below.
          Use <strong>Chrome</strong> or <strong>Edge</strong> for live speech.
        </div>

        {!highlightedQuestion ? (
          <p className="speech-no-question">⭐ Highlight a question first to answer it.</p>
        ) : (
          <>
            <div className="speech-question-ref">
              <span className="speech-question-label">Answering:</span>
              <span className="speech-question-text">
                {highlightedQuestion.text.length > 80
                  ? highlightedQuestion.text.slice(0, 80) + '…'
                  : highlightedQuestion.text}
              </span>
            </div>
            <textarea
              className="speech-manual-input"
              placeholder="Type your answer here..."
              value={transcript}
              onChange={e => {
                setTranscript(e.target.value)
                pushTranscript(e.target.value)
              }}
              rows={4}
            />
            {error && <div className="speech-error">{error}</div>}
            <div className="speech-controls">
              <button
                className="speech-btn finish"
                onClick={handleManualSubmit}
                disabled={!transcript.trim() || saving}
              >
                {saving ? 'Saving…' : '✅ Finish & Mark Answered'}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Supported — speech mode ──
  return (
    <div className="speech-panel">

      {/* Header */}
      <div className="speech-header">
        <div className="speech-title-row">
          <span className="speech-icon">🎤</span>
          <span className="speech-title">Live Speaking</span>
          {isListening && (
            <span className="speech-live-badge">
              <span className="speech-live-dot" /> LIVE
            </span>
          )}
        </div>
        <span className={`speech-status ${isListening ? 'active' : 'off'}`}>
          {isListening ? 'Microphone Active' : 'Microphone Off'}
        </span>
      </div>

      {/* No question highlighted */}
      {!highlightedQuestion && (
        <p className="speech-no-question">
          ⭐ Highlight a question from the queue to start answering it.
        </p>
      )}

      {/* Currently answering */}
      {highlightedQuestion && (
        <div className="speech-question-ref">
          <span className="speech-question-label">Answering:</span>
          <span className="speech-question-text">
            {highlightedQuestion.text.length > 80
              ? highlightedQuestion.text.slice(0, 80) + '…'
              : highlightedQuestion.text}
          </span>
        </div>
      )}

      {/* Error */}
      {error && <div className="speech-error">{error}</div>}

      {/* Transcript box */}
      {highlightedQuestion && (
        <div
          className={`speech-transcript ${isListening ? 'listening' : ''}`}
          ref={transcriptBoxRef}
        >
          {transcript
            ? transcript
            : (
              <span className="speech-placeholder">
                {isListening
                  ? 'Listening… start speaking'
                  : 'Click "Start Speaking" — students will see your words live.'}
              </span>
            )
          }
        </div>
      )}

      {/* Controls */}
      {highlightedQuestion && (
        <div className="speech-controls">
          {!isListening ? (
            <button
              className="speech-btn start"
              onClick={startListening}
              disabled={saving}
            >
              🎤 Start Speaking
            </button>
          ) : (
            <button
              className="speech-btn stop"
              onClick={stopListening}
            >
              ⏸ Pause
            </button>
          )}

          <button
            className="speech-btn finish"
            onClick={handleFinishAnswer}
            disabled={saving || (!transcript && !isListening)}
          >
            {saving ? 'Saving…' : '✅ Finish Answer'}
          </button>

          <button
            className="speech-btn clear"
            onClick={() => { setTranscript(''); transcriptRef.current = '' }}
            disabled={!transcript || isListening}
          >
            Clear
          </button>
        </div>
      )}

    </div>
  )
}