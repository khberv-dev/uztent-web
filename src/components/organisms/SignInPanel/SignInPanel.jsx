import { Divider, Heading, Logo, Text } from '@/components/atoms'
import { Alert, GoogleSignInButton } from '@/components/molecules'
import { env } from '@/config/env'
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
                Yangimisiz? Akkaunt yaratish uchun Google orqali davom eting. Davom etish orqali uztent{' '}
                <a href={`${env.apiOrigin}/public/terms_use`} target="_blank" rel="noreferrer" className={styles.link}>Foydalanish shartlari</a>ga
                rozilik bildirasiz va{' '}
                <a href={`${env.apiOrigin}/public/privacy_policy`} target="_blank" rel="noreferrer" className={styles.link}>Maxfiylik siyosati</a>{' '}
                bilan tanishganingizni tasdiqlaysiz.
            </Text>
        </div>
    )
}
