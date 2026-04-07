import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '首頁', emoji: '🏠' },
  { to: '/diet', label: '飲食', emoji: '🥗' },
  { to: '/exercise', label: '運動', emoji: '💪' },
  { to: '/progress', label: '進度', emoji: '📈' },
  { to: '/profile', label: '我的', emoji: '👤' },
]

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-2xl mb-0.5">{tab.emoji}</span>
                <span className={isActive ? 'text-primary-600' : 'text-gray-400'}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
