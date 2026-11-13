import { Navigate, Outlet, useLocation } from 'react-router'
import { useIsAuthenticated } from '@/lib/session'

/** Renders child routes only for signed-in users; otherwise redirects to /auth. */
export function ProtectedRoute() {
    const authenticated = useIsAuthenticated()
    const location = useLocation()

    if (!authenticated) {
        return <Navigate to="/auth" replace state={{ from: location.pathname }} />
    }
    return <Outlet />
}
