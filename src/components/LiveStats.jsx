export default function LiveStats({ studentCount, questionCount }) {
  return (
    <div className="live-stats">
      <div className="stat">
        <span className="stat-icon">👥</span>
        <span className="stat-value">{studentCount}</span>
        <span className="stat-label">joined</span>
      </div>

      <div className="stat-divider" />

      <div className="stat">
        <span className="stat-icon">💬</span>
        <span className="stat-value">{questionCount}</span>
        <span className="stat-label">questions</span>
      </div>

      <span className="live-dot">● LIVE</span>
    </div>
  )
}