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
                    <Heading level={1}>Live on <span className={styles.accent}>uztent</span></Heading>
                ) : isPending ? (
                    <Skeleton style={{ height: '4.4rem', width: '32rem', maxWidth: '100%' }} />
                ) : (
                    <Heading level={1}>
                        Welcome{user ? <>, <span className={styles.accent}>{displayName(user)}</span></> : null}
                    </Heading>
                )}
                <Text tone="muted" size="lg">Here’s who’s live right now.</Text>
            </header>

            {user && !user.username && (
                <Alert variant="info">
                    Pick a username so people can find you.{' '}
                    <Link to={paths.settings} className={styles.link}>Go to settings</Link>
                </Alert>
            )}

            <StreamGrid />
        </div>
    )
}
