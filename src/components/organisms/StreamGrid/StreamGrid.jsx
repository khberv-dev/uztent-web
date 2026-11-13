import { Link } from 'react-router'
import { getErrorMessage } from '@/api/errors'
import { Badge, Button, Heading } from '@/components/atoms'
import { Alert, EmptyState, VideoCard, VideoCardSkeleton } from '@/components/molecules'
import { streamerName, useLiveStreams } from '@/features/streams'
import { useMe } from '@/features/users'
import { formatCount, formatDuration, formatTimeAgo, hueFromId } from '@/lib/format'
import { flattenPages } from '@/lib/pagination'
import { paths } from '@/routes/paths'
import styles from './StreamGrid.module.css'

/** Live streams from GET /streams, newest first, with "Show more". */
export function StreamGrid({ title = 'Hozir live’da' }) {
    const { data: me } = useMe()
    const { data, isPending, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useLiveStreams()
    const streams = flattenPages(data)

    return (
        <section className={styles.section}>
            <Heading level={3}>{title}</Heading>

            {isError && (
                <Alert>
                    {getErrorMessage(error, 'Live streamlarni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                </Alert>
            )}

            {!isPending && !isError && streams.length === 0 && (
                <EmptyState
                    icon="broadcast"
                    title="Hozir hech kim live’da emas"
                    description="Birinchi boʻling: streamingizni sozlang va encoder orqali live’ga chiqing."
                    action={<Button as={Link} to={paths.dashboard.home}>Live’ga chiqish</Button>}
                />
            )}

            <div className={styles.grid}>
                {isPending && Array.from({ length: 8 }, (_, i) => <VideoCardSkeleton key={i} />)}
                {streams.map((stream) => {
                    const name = streamerName(stream.userId, me)
                    return (
                        <VideoCard
                            key={stream.id}
                            to={paths.stream(stream.id)}
                            title={stream.title}
                            avatarName={name}
                            lines={[name, `${formatTimeAgo(stream.startedAt)} boshlangan`]}
                            hue={hueFromId(stream.id)}
                            topLeft={<Badge variant="live">Live</Badge>}
                            bottomLeft={<Badge variant="overlay">{formatCount(stream.viewers)} tomoshabin</Badge>}
                            bottomRight={<Badge variant="overlay">{formatDuration(stream.startedAt)}</Badge>}
                        />
                    )
                })}
            </div>

            {hasNextPage && (
                <div className={styles.more}>
                    <Button variant="secondary" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                        Yana koʻrsatish
                    </Button>
                </div>
            )}
        </section>
    )
}
