import { useLocation } from 'react-router'
import { SignInPanel } from '@/components/organisms'

export function AuthPage() {
    const location = useLocation()
    // Set by GoogleCallbackPage when the sign-in exchange fails
    const error = location.state?.error

    return <SignInPanel error={error} returnTo={location.state?.from} />
}
