import { Routes, Route } from 'react-router-dom'
import JoinSession from './pages/JoinSession'
import StudentView from './pages/StudentView'
import LecturerView from './pages/LecturerView'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinSession />} />
      <Route path="/student/:sessionId" element={<StudentView />} />
      <Route path="/lecturer/:sessionId" element={<LecturerView />} />
    </Routes>
  )
}