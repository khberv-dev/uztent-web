import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { getErrorMessage } from '@/api/errors'
import { Spinner, Text } from '@/components/atoms'
import { useGoogleSignIn } from '@/features/auth'
import { parseGoogleCallback, takeGoogleReturnTo } from '@/lib/googleOAuth'
import { paths } from '@/routes/paths'
import styles from './GoogleCallbackPage.module.css'

/**
 * Landing page for Google's redirect (/auth/google#id_token=...).
 * Extracts the ID token, exchanges it via POST /auth/google, then goes home.
 */
export function GoogleCallbackPage() {
    const navigate = useNavigate()
    const startedRef = useRef(false)

    const { mutate } = useGoogleSignIn({
        onSuccess: () => navigate(takeGoogleReturnTo() ?? paths.home, { replace: true }),
        onError: (error) =>
            navigate(paths.auth, { replace: true, state: { error: getErrorMessage(error, 'Google orqali kirib boʻlmadi. Qayta urinib koʻring.') } }),
    })

    useEffect(() => {
        // Guard against StrictMode's double effect: the state check is one-shot
        if (startedRef.current) return
        startedRef.current = true

        const result = parseGoogleCallback(window.location.hash)
        // Remove the token from the address bar and history
        window.history.replaceState(null, '', window.location.pathname)

        if ('error' in result) {
            navigate(paths.auth, { replace: true, state: { error: result.error } })
            return
        }
        mutate(result.idToken)
    }, [mutate, navigate])

    return (
        <div className={styles.page}>
            <Spinner size="lg" className={styles.spinner} />
            <Text tone="muted">Kirilmoqda…</Text>
        </div>
    )
}
