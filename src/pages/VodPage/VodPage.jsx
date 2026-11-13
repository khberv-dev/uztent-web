import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { getErrorMessage, getErrorStatus } from '@/api/errors'
import { Avatar, Button, Heading, Icon, Skeleton, Text } from '@/components/atoms'
import { Alert, ConfirmButton, EmptyState, VideoPlayer } from '@/components/molecules'
import { ChatPanel, VodGrid } from '@/components/organisms'
import { streamerName } from '@/features/streams'
import { useMe } from '@/features/users'
import { useDeleteVod, useVod } from '@/features/vods'
import { formatCount, formatDate, formatDuration, hueFromId, isUuid } from '@/lib/format'
import { paths } from '@/routes/paths'
import styles from '../watch.module.css'

function NotFound() {
    return (
        <EmptyState
            icon="alert"
            title="Video not found"
            description="It may have been deleted, or the link is wrong."
            action={<Button as={Link} to={paths.home}>Go home</Button>}
        />
    )
}

export function VodPage() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { data: me } = useMe()
    const { data: vod, isPending, error } = useVod(id)
    const remove = useDeleteVod({ onSuccess: () => navigate(paths.dashboard.videos, { replace: true }) })

    if (!isUuid(id) || getErrorStatus(error) === 404) return <NotFound />
    if (error && !vod) return <Alert>{getErrorMessage(error, 'Couldn’t load the video.')}</Alert>

    if (isPending) {
        return (
            <div className={styles.page}>
                <Skeleton style={{ aspectRatio: '16 / 9', width: '100%' }} />
                <Skeleton style={{ height: '2.4rem', width: '40%' }} />
            </div>
        )
    }

    const name = streamerName(vod.userId, me)
    const isOwn = me?.id === vod.userId

    return (
        <div className={styles.withChat}>
            <div className={styles.page}>
                {location.state?.ended && (
                    <Alert variant="info">This stream has ended. Here’s the recording.</Alert>
                )}

                <div className={styles.playerWrap}>
                    {vod.videoUri ? (
                        <VideoPlayer key={vod.videoUri} src={vod.videoUri} poster={vod.previewUri} />
                    ) : (
                        <div className={styles.processing} style={{ '--hue': hueFromId(vod.id), position: 'relative' }}>
                            {vod.previewUri && <img src={vod.previewUri} alt="" />}
                            <Icon name="clock" size={32} />
                            <Text weight="semibold">The recording is still being processed.</Text>
                            <Text size="sm" tone="muted">This page checks again every 30 seconds.</Text>
                        </div>
                    )}
                </div>

                <div className={styles.info}>
                    <div className={styles.identity}>
                        <Avatar name={name} size="lg" />
                        <div className={styles.details}>
                            <Heading level={2}>{vod.title}</Heading>
                            <Text tone="primary" weight="semibold">{name}</Text>
                            <div className={styles.metaRow}>
                                <Text size="sm" tone="muted">Streamed {formatDate(vod.startedAt)}</Text>
                                <Text size="sm" tone="muted">·</Text>
                                <Text size="sm" tone="muted">{formatDuration(vod.startedAt, vod.endedAt)}</Text>
                                <Text size="sm" tone="muted">·</Text>
                                <Text size="sm" tone="muted">Peak {formatCount(vod.peakViewers)} viewers</Text>
                            </div>
                        </div>
                    </div>
                    {isOwn && (
                        <div className={styles.actions}>
                            <ConfirmButton
                                variant="secondary"
                                leftIcon={<Icon name="trash" size={16} />}
                                confirmLabel="Delete video"
                                loading={remove.isPending}
                                onConfirm={() => remove.mutate(vod.id)}
                            >
                                Delete
                            </ConfirmButton>
                        </div>
                    )}
                </div>

                {remove.isError && <Alert>{getErrorMessage(remove.error, 'Couldn’t delete the video.')}</Alert>}

                <VodGrid userId={vod.userId} title="More from this streamer" limit={8} excludeId={vod.id} hideWhenEmpty />
            </div>
            <ChatPanel streamId={vod.id} ownerId={vod.userId} live={false} className={styles.chat} />
        </div>
    )
}
