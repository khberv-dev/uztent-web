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
                <Heading level={2}>uztent’ga kirish</Heading>
                <Text tone="muted" size="md">Live streamlarni tomosha qiling, kanallarni kuzating va chatga qoʻshiling.</Text>
            </div>

            {error && <Alert>{error}</Alert>}

            <GoogleSignInButton returnTo={returnTo} />

            <Divider>yoki</Divider>

            <LoginForm />

            <Text size="xs" tone="subtle" className={styles.legal}>
                Yangimisiz? Akkaunt yaratish uchun Google orqali davom eting. Davom etish orqali uztent Foydalanish
                shartlariga rozilik bildirasiz va Maxfiylik siyosati bilan tanishganingizni tasdiqlaysiz.
            </Text>
        </div>
    )
}
