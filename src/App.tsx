import { Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import Navigation from './components/Navigation'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import DietLog from './pages/DietLog'
import Exercise from './pages/Exercise'
import Progress from './pages/Progress'
import AIAnalysis from './pages/AIAnalysis'
import Profile from './pages/Profile'

export default function App() {
  const profile = useStore((s) => s.profile)

  if (!profile) {
    return <Onboarding />
  }

  return (
    <div className="relative">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/diet" element={<DietLog />} />
        <Route path="/exercise" element={<Exercise />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/ai" element={<AIAnalysis />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Navigation />
    </div>
  )
}
