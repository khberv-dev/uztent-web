import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getErrorMessage } from '@/api/errors'
import { Avatar, Button, Heading, Skeleton, Text } from '@/components/atoms'
import { Alert, EmptyState } from '@/components/molecules'
import { LiveStreamView, VodGrid } from '@/components/organisms'
import { useChannelStream } from '@/features/streams'
import { USERNAME_PATTERN, useMe } from '@/features/users'
import { useIsAuthenticated } from '@/lib/session'
import { paths } from '@/routes/paths'
import styles from './ChannelPage.module.css'

/**
 * A user's live stream by username (/w/:username, public GET /streams/:username).
 * WebSocket events switch it between live and offline and update the viewer count.
 */
export function ChannelPage() {
    const { username: raw = '' } = useParams()
    const username = raw.trim().toLowerCase() // usernames are stored lowercase
    const valid = USERNAME_PATTERN.test(username)
    const authenticated = useIsAuthenticated()
    const { data: me } = useMe()
    const { data: channel, isPending, isError, error, refetch } = useChannelStream(username)
    const stream = channel?.status === 'live' ? channel.stream : null
    const isOwn = Boolean(me?.username) && me.username === username

    // Remember the last session seen here: once it ends we can link its recording and list the
    // channel's VODs (GET /streams/:username returns nothing while offline, so this is our only userId)
    const [lastStream, setLastStream] = useState(null)
    if (stream && stream.id !== lastStream?.id) setLastStream({ id: stream.id, userId: stream.userId })

    if (!valid) {
        return (
            <EmptyState
                icon="alert"
                title="Kanal topilmadi"
                description="Bunday username boʻlishi mumkin emas."
                action={<Button as={Link} to={paths.home}>Live streamlarni koʻrish</Button>}
            />
        )
    }

    if (isPending) {
        return (
            <div className={styles.page}>
                <Skeleton style={{ aspectRatio: '16 / 9', width: '100%' }} />
                <Skeleton style={{ height: '2.4rem', width: '40%' }} />
            </div>
        )
    }

    if (isError && channel === undefined) {
        return (
            <Alert>
                {getErrorMessage(error, 'Kanalni yuklab boʻlmadi.')}{' '}
                <Button variant="ghost" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
            </Alert>
        )
    }

    if (channel.status === 'not-found') {
        return (
            <EmptyState
                icon="alert"
                title="Kanal topilmadi"
                description={`${username} nomli foydalanuvchi yoʻq.`}
                action={<Button as={Link} to={paths.home}>Live streamlarni koʻrish</Button>}
            />
        )
    }

    if (!stream) {
        return (
            <div className={styles.page}>
                <div className={styles.offline}>
                    <Avatar name={username} size="lg" />
                    <Heading level={2}>{username}</Heading>
                    <Text tone="muted">
                        {isOwn ? 'Siz offline’siz. Live’ga chiqish uchun encoder’da streamni boshlang.' : `${username} hozir live’da emas. Live’ga chiqqanda bu sahifada stream oʻzi boshlanadi.`}
                    </Text>
                    <div className={styles.actions}>
                        {lastStream && (
                            <Button as={Link} to={paths.vod(lastStream.id)}>Yozuvni koʻrish</Button>
                        )}
                        {isOwn ? (
                            <Button as={Link} to={paths.dashboard.home} variant="secondary">Stream boshqaruvi</Button>
                        ) : (
                            <Button as={Link} to={paths.home} variant="secondary">Live streamlarni koʻrish</Button>
                        )}
                    </div>
                </div>
                {lastStream && authenticated && (
                    <VodGrid userId={lastStream.userId} title="Oldingi streamlar" limit={8} hideWhenEmpty />
                )}
            </div>
        )
    }

    return (
        <div className={styles.page}>
            {/* key: a new broadcast is a new session (same playback URL), so start the player fresh */}
            <LiveStreamView key={stream.id} stream={stream} name={username} isOwn={isOwn} />
        </div>
    )
}
