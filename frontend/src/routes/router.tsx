import { createBrowserRouter, redirect } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import RootLayout from '../layouts/RootLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'

// Lazy load components
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const BrowseStocks = lazy(() => import('../pages/BrowseStocks'))
const StockDetail = lazy(() => import('../pages/StockDetail'))
const Trade = lazy(() => import('../pages/Trade'))
const Portfolio = lazy(() => import('../pages/Portfolio'))
const Profile = lazy(() => import('../pages/Profile'))
const LayoutAdmin = lazy(() => import('../pages/LayoutAdmin'))

// Error boundary component
function ErrorBoundary() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
      <p className="text-lg">Something went wrong. Please try again.</p>
    </div>
  )
}

// Loading component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  )
}

const routes = {
  public: [
    {
      path: 'login',
      element: <Login />,
    },
    {
      path: 'register',
      element: <Register />,
    },
  ],
  protected: [
    {
      path: 'dashboard',
      element: <Dashboard />,
    },
    {
      path: 'browse',
      element: <BrowseStocks />,
    },
    {
      path: 'stock/:stockId',
      element: <StockDetail />,
    },
    {
      path: 'trade',
      element: <Trade />,
    },
    {
      path: 'portfolio',
      element: <Portfolio />,
    },
    {
      path: 'profile',
      element: <Profile />,
    },
    {
      path: 'admin/layout',
      element: <LayoutAdmin />,
    },
  ],
}

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
)

const withProtection = (element: React.ReactNode) => (
  <ProtectedRoute>{withSuspense(element)}</ProtectedRoute>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      // Default to dashboard
      {
        index: true,
        loader: () => redirect('/dashboard'),
      },
      // Public routes
      ...routes.public.map((route) => ({
        ...route,
        element: withSuspense(route.element),
      })),

      // Protected routes
      ...routes.protected.map((route) => ({
        ...route,
        element: withProtection(route.element),
      })),

      // Catch-all route
      {
        path: '*',
        loader: () => redirect('/'),
      },
    ],
  },
])
