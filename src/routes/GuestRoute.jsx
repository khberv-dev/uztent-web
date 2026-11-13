import { Navigate, Outlet, useLocation } from 'react-router'
import { useIsAuthenticated } from '@/lib/session'

/** Renders child routes only for signed-out users; otherwise goes back where they came from (or home). */
export function GuestRoute() {
    const authenticated = useIsAuthenticated()
    const location = useLocation()

    if (authenticated) {
        return <Navigate to={location.state?.from ?? '/'} replace />
    }
    return <Outlet />
}
