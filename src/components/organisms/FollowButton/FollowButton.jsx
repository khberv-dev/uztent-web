import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getErrorMessage } from '@/api/errors'
import { Button, Icon } from '@/components/atoms'
import { useFollowStatus, useSetFollowing } from '@/features/follows'
import { useIsAuthenticated } from '@/lib/session'
import { paths } from '@/routes/paths'
import styles from './FollowButton.module.css'

/**
 * Follow / unfollow a streamer. Signed-out visitors get a sign-in link that brings them back here.
 * While following, hovering the button offers to unfollow.
 * @param {{userId: string, className?: string}} props
 */
export function FollowButton({ userId, className }) {
    const authenticated = useIsAuthenticated()
    const location = useLocation()
    const { data: status, isPending } = useFollowStatus(userId)
    const [error, setError] = useState(null)
    const setFollowing = useSetFollowing(userId, {
        onMutate: () => setError(null),
        onError: (err) => setError(getErrorMessage(err, 'Amalni bajarib boʻlmadi.')),
    })

    if (!authenticated) {
        return (
            <Button as={Link} to={paths.auth} state={{ from: location.pathname }} leftIcon={<Icon name="heart" size={18} />} className={className}>
                Obuna boʻlish
            </Button>
        )
    }

    const following = status?.following ?? false
    return (
        <div className={styles.wrap}>
            <Button
                variant={following ? 'secondary' : 'primary'}
                leftIcon={<Icon name={following ? 'check' : 'heart'} size={18} />}
                loading={setFollowing.isPending}
                disabled={isPending}
                aria-pressed={following}
                onClick={() => setFollowing.mutate(!following)}
                className={className}
            >
                {following ? (
                    <span className={styles.swap}>
                        <span className={styles.idle}>Obunadasiz</span>
                        <span className={styles.hover} aria-hidden="true">Bekor qilish</span>
                    </span>
                ) : (
                    'Obuna boʻlish'
                )}
            </Button>
            {error && <span role="alert" className={styles.error}>{error}</span>}
        </div>
    )
}
