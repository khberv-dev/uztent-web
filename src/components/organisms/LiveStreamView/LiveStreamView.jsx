import { Link } from 'react-router'
import { Avatar, Badge, Button, Heading, Text } from '@/components/atoms'
import { LivePlayer } from '@/components/molecules'
import { useNow } from '@/hooks/useNow'
import { useIsAuthenticated } from '@/lib/session'
import { formatCount, formatDuration } from '@/lib/format'
import { paths } from '@/routes/paths'
import { ChatPanel } from '../ChatPanel'
import { VodGrid } from '../VodGrid'
import styles from './LiveStreamView.module.css'

/**
 * A live stream: player, title / streamer / live meta and the streamer's past broadcasts, with the
 * chat beside it (below it on narrow screens).
 * Shared by /streams/:id and /w/:username.
 * @param {{stream: import('@/api/streams').Stream, name: string, isOwn?: boolean}} props
 */
export function LiveStreamView({ stream, name, isOwn = false }) {
    const now = useNow()
    const authenticated = useIsAuthenticated() // the page is public; VOD endpoints need a login

    return (
        <div className={styles.layout}>
            <div className={styles.view}>
                <div className={styles.playerWrap}>
                    <LivePlayer url={stream.url} renditions={stream.renditions} />
                </div>

                <div className={styles.info}>
                    <div className={styles.identity}>
                        <Avatar name={name} size="lg" live />
                        <div className={styles.details}>
                            <Heading level={2}>{stream.title}</Heading>
                            <Text tone="primary" weight="semibold">{name}</Text>
                            <div className={styles.metaRow}>
                                <Badge variant="live">Live</Badge>
                                <Text size="sm" tone="muted">{formatCount(stream.viewers)} tomoshabin</Text>
                                <Text size="sm" tone="muted">·</Text>
                                <Text size="sm" tone="muted">{formatDuration(stream.startedAt, new Date(now).toISOString())}</Text>
                            </div>
                        </div>
                    </div>
                    {isOwn && (
                        <Button as={Link} to={paths.dashboard.home} variant="secondary">Streamni boshqarish</Button>
                    )}
                </div>

                {authenticated && <VodGrid userId={stream.userId} title="Oldingi streamlar" limit={8} hideWhenEmpty />}
            </div>
            <ChatPanel
                streamId={stream.id}
                ownerId={stream.userId}
                live
                slowModeSeconds={stream.chatSlowModeSeconds ?? 0}
                className={styles.chat}
            />
        </div>
    )
}
