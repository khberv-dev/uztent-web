import { Link, Navigate, useParams } from 'react-router'
import { getErrorMessage, getErrorStatus } from '@/api/errors'
import { Button, Skeleton, Spinner } from '@/components/atoms'
import { Alert, EmptyState } from '@/components/molecules'
import { LiveStreamView } from '@/components/organisms'
import { streamerName, useStream } from '@/features/streams'
import { useMe } from '@/features/users'
import { useVod } from '@/features/vods'
import { isUuid } from '@/lib/format'
import { useIsAuthenticated } from '@/lib/session'
import { paths } from '@/routes/paths'
import styles from '../watch.module.css'

function NotFound() {
    return (
        <EmptyState
            icon="alert"
            title="Stream topilmadi"
            description="U tugagan yoki link notoʻgʻri boʻlishi mumkin."
            action={<Button as={Link} to={paths.home}>Live streamlarni koʻrish</Button>}
        />
    )
}

/** A live session by id (/streams/:id). For a channel's current stream by username, see ChannelPage. */
export function StreamPage() {
    const { id } = useParams()
    const valid = isUuid(id)
    const { data: me } = useMe()
    const { data: stream, isPending, error } = useStream(id)

    // 404 = not found OR ended. An ended stream has a VOD with the same id.
    // This also catches a stream ending while someone is watching (the 30s refetch starts returning 404).
    const gone = valid && getErrorStatus(error) === 404
    const authenticated = useIsAuthenticated()
    // GET /vods/:id needs a login; signed-out visitors just see "not found / ended"
    const vod = useVod(id, { enabled: gone && authenticated })

    if (!valid) return <NotFound />
    if (gone) {
        if (authenticated && vod.isPending) return <div className={styles.page}><Spinner size="lg" /></div>
        if (vod.data) return <Navigate to={paths.vod(id)} replace state={{ ended: true }} />
        return <NotFound />
    }
    if (error && !stream) return <Alert>{getErrorMessage(error, 'Streamni yuklab boʻlmadi.')}</Alert>

    if (isPending) {
        return (
            <div className={styles.page}>
                <Skeleton style={{ aspectRatio: '16 / 9', width: '100%' }} />
                <Skeleton style={{ height: '2.4rem', width: '40%' }} />
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <LiveStreamView stream={stream} name={streamerName(stream.userId, me)} isOwn={me?.id === stream.userId} />
        </div>
    )
}
