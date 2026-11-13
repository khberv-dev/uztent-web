import { Divider, Heading, Logo, Text } from '@/components/atoms'
import { Alert, GoogleSignInButton } from '@/components/molecules'
import { LoginForm } from '../LoginForm'
import styles from './SignInPanel.module.css'

/** Auth card: Google sign-in (also signs up) plus password login. `error` comes from a failed Google redirect. */
export function SignInPanel({ error, returnTo }) {
    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <Logo size={40} />
                <Heading level={2}>Log in to uztent</Heading>
                <Text tone="muted" size="md">Watch live streams, follow channels and join the chat.</Text>
            </div>

            {error && <Alert>{error}</Alert>}

            <GoogleSignInButton returnTo={returnTo} />

            <Divider>or</Divider>

            <LoginForm />

            <Text size="xs" tone="subtle" className={styles.legal}>
                New here? Continue with Google to create an account. By continuing, you agree to the uztent Terms of
                Service and acknowledge the Privacy Notice.
            </Text>
        </div>
    )
}
