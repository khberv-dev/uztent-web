import { Button, GoogleMark } from '@/components/atoms'
import { redirectToGoogle } from '@/lib/googleOAuth'
import styles from './GoogleSignInButton.module.css'

/** @param {{returnTo?: string, loading?: boolean, children?: React.ReactNode}} props */
export function GoogleSignInButton({ returnTo, loading = false, children = 'Google orqali davom etish' }) {
    return (
        <Button
            variant="outline"
            size="lg"
            fullWidth
            loading={loading}
            leftIcon={<GoogleMark className={styles.mark} />}
            onClick={() => redirectToGoogle(returnTo)}
        >
            {children}
        </Button>
    )
}
