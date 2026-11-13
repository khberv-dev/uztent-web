import { getErrorMessage } from '@/api/errors'
import { Badge, Button, Heading } from '@/components/atoms'
import { Alert, ConfirmButton, EmptyState, VideoCard, VideoCardSkeleton } from '@/components/molecules'
import { streamerName } from '@/features/streams'
import { useMe } from '@/features/users'
import { useDeleteVod, useMyVods, useUserVods } from '@/features/vods'
import { formatDate, formatDuration, hueFromId } from '@/lib/format'
import { flattenPages } from '@/lib/pagination'
import { paths } from '@/routes/paths'
import styles from './VodGrid.module.css'

function DeleteVodButton({ id }) {
    const { mutate, isPending, isError, error } = useDeleteVod()
    return (
        <span title={isError ? getErrorMessage(error, 'Oʻchirib boʻlmadi.') : undefined}>
            <ConfirmButton
                size="sm"
                variant="ghost"
                confirmLabel="Oʻchirish"
                loading={isPending}
                onConfirm={() => mutate(id)}
                aria-label="Videoni oʻchirish"
            >
                Oʻchirish
            </ConfirmButton>
        </span>
    )
}

/**
 * VOD grid. `userId` lists that user's VODs (GET /users/:userId/vods); without it, the caller's own (GET /vods/me).
 * Delete buttons appear only on the caller's own VODs.
 *
 * @param {{userId?: string, title?: string, limit?: number, excludeId?: string, emptyTitle?: string, emptyDescription?: string, hideWhenEmpty?: boolean}} props
 */
export function VodGrid({ userId, title, limit = 20, excludeId, emptyTitle = 'Hali videolar yoʻq', emptyDescription, hideWhenEmpty = false }) {
    const { data: me } = useMe()
    const mine = useMyVods({ limit, enabled: !userId })
    const theirs = useUserVods(userId, { limit })
    const query = userId ? theirs : mine
    const { data, isPending, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = query
    const vods = flattenPages(data).filter((vod) => vod.id !== excludeId)

    if (hideWhenEmpty && !isPending && !isError && vods.length === 0) return null

    return (
        <section className={styles.section}>
            {title && <Heading level={3}>{title}</Heading>}

            {isError && (
                <Alert>
                    {getErrorMessage(error, 'Videolarni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                </Alert>
            )}

            {!isPending && !isError && vods.length === 0 && (
                <EmptyState title={emptyTitle} description={emptyDescription} />
            )}

            <div className={styles.grid}>
                {isPending && Array.from({ length: Math.min(limit, 8) }, (_, i) => <VideoCardSkeleton key={i} />)}
                {vods.map((vod) => {
                    const name = streamerName(vod.userId, me)
                    const isOwn = me?.id === vod.userId
                    return (
                        <VideoCard
                            key={vod.id}
                            to={paths.vod(vod.id)}
                            title={vod.title}
                            avatarName={name}
                            lines={[name, formatDate(vod.startedAt)]}
                            thumbnailUrl={vod.previewUri}
                            hue={hueFromId(vod.id)}
                            topLeft={!vod.videoUri ? <Badge variant="overlay">Ishlanmoqda</Badge> : null}
                            bottomLeft={<Badge variant="overlay">{formatDuration(vod.startedAt, vod.endedAt)}</Badge>}
                            actions={isOwn ? <DeleteVodButton id={vod.id} /> : null}
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
