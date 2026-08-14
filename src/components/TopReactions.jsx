export default function TopReactions({ questions = [] }) {
  const totals = {
    heart: 0,
    fire: 0,
    thumbs: 0,
  }

  questions.forEach((question) => {
    totals.heart += question.reactions?.heart ?? 0
    totals.fire += question.reactions?.fire ?? 0
    totals.thumbs += question.reactions?.thumbs ?? 0
  })

  const reactions = [
    {
      type: 'heart',
      emoji: '❤️',
      label: 'Heart',
      count: totals.heart,
    },
    {
      type: 'fire',
      emoji: '🔥',
      label: 'Fire',
      count: totals.fire,
    },
    {
      type: 'thumbs',
      emoji: '👍',
      label: 'Thumbs Up',
      count: totals.thumbs,
    },
  ]

  // Highest reaction first
  reactions.sort((a, b) => b.count - a.count)

  return (
    <div className="top-reactions">
      <div className="top-reactions-title">
        🔥 Top Reactions
      </div>

      <div className="top-reactions-list">
        {reactions.map((reaction) => (
          <div
            key={reaction.type}
            className="top-reaction-item"
          >
            <span className="top-reaction-emoji">
              {reaction.emoji}
            </span>

            <div className="top-reaction-info">
              <span className="top-reaction-label">
                {reaction.label}
              </span>

              <strong className="top-reaction-count">
                {reaction.count}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}