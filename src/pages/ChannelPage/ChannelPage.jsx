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
                title="Channel not found"
                description="That isn’t a valid username."
                action={<Button as={Link} to={paths.home}>Browse live streams</Button>}
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
                {getErrorMessage(error, 'Couldn’t load this channel.')}{' '}
                <Button variant="ghost" size="sm" onClick={() => refetch()}>Try again</Button>
            </Alert>
        )
    }

    if (channel.status === 'not-found') {
        return (
            <EmptyState
                icon="alert"
                title="Channel not found"
                description={`There’s no user called ${username}.`}
                action={<Button as={Link} to={paths.home}>Browse live streams</Button>}
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
                        {isOwn ? 'You’re offline. Start streaming in your encoder to go live.' : `${username} isn’t live right now. This page will start playing when they go live.`}
                    </Text>
                    <div className={styles.actions}>
                        {lastStream && (
                            <Button as={Link} to={paths.vod(lastStream.id)}>Watch the recording</Button>
                        )}
                        {isOwn ? (
                            <Button as={Link} to={paths.dashboard.home} variant="secondary">Stream manager</Button>
                        ) : (
                            <Button as={Link} to={paths.home} variant="secondary">Browse live streams</Button>
                        )}
                    </div>
                </div>
                {lastStream && authenticated && (
                    <VodGrid userId={lastStream.userId} title="Past broadcasts" limit={8} hideWhenEmpty />
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
