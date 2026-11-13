import { Link } from 'react-router'
import { Heading, Skeleton, Text } from '@/components/atoms'
import { Alert } from '@/components/molecules'
import { StreamGrid } from '@/components/organisms'
import { displayName } from '@/features/auth'
import { useMe } from '@/features/users'
import { useIsAuthenticated } from '@/lib/session'
import { paths } from '@/routes/paths'
import styles from './HomePage.module.css'

export function HomePage() {
    const authenticated = useIsAuthenticated()
    const { data: user, isPending } = useMe()

    return (
        <div className={styles.page}>
            <header className={styles.hero}>
                {!authenticated ? (
                    <Heading level={1}><span className={styles.accent}>uztent</span>’da hozir live</Heading>
                ) : isPending ? (
                    <Skeleton style={{ height: '4.4rem', width: '32rem', maxWidth: '100%' }} />
                ) : (
                    <Heading level={1}>
                        Xush kelibsiz{user ? <>, <span className={styles.accent}>{displayName(user)}</span></> : null}
                    </Heading>
                )}
                <Text tone="muted" size="lg">Hozir live’da boʻlganlar.</Text>
            </header>

            {user && !user.username && (
                <Alert variant="info">
                    Sizni topishlari uchun username tanlang.{' '}
                    <Link to={paths.settings} className={styles.link}>Sozlamalarga oʻtish</Link>
                </Alert>
            )}

            <StreamGrid />
        </div>
    )
}
