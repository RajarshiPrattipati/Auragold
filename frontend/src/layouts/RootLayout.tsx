import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import { Notification } from '../components/ui/Notification'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { UiConfigSync } from '@/features/uiConfig/UiConfigSync'

const publicNavLinks: Array<{ to: string; label: string }> = []

const privateNavLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/browse', label: 'Browse Stocks' },
  { to: '/trade', label: 'Trade' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/profile', label: 'Profile' },
  // Admin link (currently visible to all authenticated users)
  { to: '/admin/layout', label: 'Admin' },
] as const

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()
  const linkBase =
    'text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors'
  const activeLink = 'text-primary font-semibold underline underline-offset-4'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-card text-card-foreground shadow-sm transition-colors">
      <div className="container mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Brand + primary nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AURAGOLD
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {publicNavLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={location.pathname === to ? `${linkBase} ${activeLink}` : linkBase}
                >
                  {label}
                </Link>
              ))}
              {isAuthenticated &&
                privateNavLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={location.pathname === to ? `${linkBase} ${activeLink}` : linkBase}
                  >
                    {label}
                  </Link>
                ))}
            </div>
          </div>

          {/* Right: Auth action */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-card-foreground hover:text-primary"
              >
                Logout
              </Button>
            ) : (
              <Link
                to="/login"
                className={location.pathname === '/login' ? `${linkBase} ${activeLink}` : linkBase}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout() {
  const currentYear = new Date().getFullYear()

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <UiConfigSync />
        <Navigation />
        <main className="flex-1 container mx-auto px-6 py-8">
          <Outlet />
        </main>
        <footer className="bg-card text-card-foreground shadow-sm transition-colors mt-auto">
          <div className="container mx-auto px-6 py-4">
            <p className="text-center text-muted-foreground">
              {currentYear} FastAPI React Starter. All rights reserved.
            </p>
          </div>
        </footer>
        <Notification />
      </div>
    </AppProvider>
  )
}
