import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Home, Users, Clock, Images, Shuffle, ListChecks, Mail, Disc3, BedDouble, LayoutDashboard, LogOut, LogIn, Moon, Sun, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSite } from '../context/SiteContext'

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/us', label: 'Us', icon: Users },
  { to: '/story', label: 'Our Story', icon: Clock },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/take-me-back', label: 'Take Me Back', icon: Shuffle },
  { to: '/bucket-list', label: 'Bucket List', icon: ListChecks },
  { to: '/love-wheel', label: 'Love Wheel', icon: Disc3, private: true },
  { to: '/letters', label: 'Letters', icon: Mail, private: true },
  { to: '/little-room', label: 'Little Room', icon: BedDouble, private: true },
  { to: '/memory-map', label: 'Memory Map', icon: MapPin, private: true },
  { to: '/admin', label: 'Editor', icon: LayoutDashboard, private: true },
]

export function FloatingNav() {
  const { isMember, signOut, user } = useAuth()
  const { isDark: dark, updateTheme } = useSite()
  const toggleDark = () => updateTheme({ mode: dark ? 'light' : 'dark' }, { immediate: true, quiet: true })

  const visible = links.filter((l) => !l.private || isMember)

  return (
    <motion.div
      initial={{ x: '-50%', y: 100, opacity: 0 }}
      animate={{ x: '-50%', y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/40 bg-white/60 p-2 pb-2 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-black/40"
    >
      <ul className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="relative">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center rounded-full px-3 py-2 transition-colors duration-200 ${
                  isActive
                    ? 'text-blush-900 dark:text-white font-semibold'
                    : 'text-stone-600 hover:bg-blush-100/50 dark:text-stone-300 dark:hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-white/80 via-blush-200/60 to-blush-300/50 shadow-sm backdrop-blur-md border border-white/60 dark:from-white/20 dark:via-white/15 dark:to-white/10 dark:border-white/20 dark:shadow-white/5"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex flex-col items-center">
                    <Icon className="h-5 w-5" />
                    <span className="mt-0.5 text-[10px] font-medium">{label.split(' ')[0]}</span>
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        {!isMember && (
          <li className="relative">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center rounded-full px-3 py-2 transition-colors duration-200 ${
                  isActive
                    ? 'text-blush-900 dark:text-white font-semibold'
                    : 'text-stone-600 hover:bg-blush-100/50 dark:text-stone-300 dark:hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-white/80 via-blush-200/60 to-blush-300/50 shadow-sm backdrop-blur-md border border-white/60 dark:from-white/20 dark:via-white/15 dark:to-white/10 dark:border-white/20 dark:shadow-white/5"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex flex-col items-center">
                    <LogIn className="h-5 w-5" />
                    <span className="mt-0.5 text-[10px] font-medium">Login</span>
                  </span>
                </>
              )}
            </NavLink>
          </li>
        )}
      </ul>

      <div className="h-8 w-px bg-stone-300/50 dark:bg-white/10" />

      <button onClick={toggleDark} className="rounded-full p-3 text-stone-600 hover:bg-blush-100/50 dark:text-stone-300 dark:hover:bg-white/10">
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {isMember && (
        <button onClick={signOut} className="rounded-full p-3 text-stone-600 hover:bg-blush-100/50 dark:text-stone-300 dark:hover:bg-white/10">
          <LogOut className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  )
}
