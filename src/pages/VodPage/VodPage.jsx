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
            title="Video topilmadi"
            description="U oʻchirilgan yoki link notoʻgʻri boʻlishi mumkin."
            action={<Button as={Link} to={paths.home}>Bosh sahifaga</Button>}
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
    if (error && !vod) return <Alert>{getErrorMessage(error, 'Videoni yuklab boʻlmadi.')}</Alert>

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
                    <Alert variant="info">Stream tugadi. Mana uning yozuvi.</Alert>
                )}

                <div className={styles.playerWrap}>
                    {vod.videoUri ? (
                        <VideoPlayer key={vod.videoUri} src={vod.videoUri} poster={vod.previewUri} />
                    ) : (
                        <div className={styles.processing} style={{ '--hue': hueFromId(vod.id), position: 'relative' }}>
                            {vod.previewUri && <img src={vod.previewUri} alt="" />}
                            <Icon name="clock" size={32} />
                            <Text weight="semibold">Yozuv hali ishlanmoqda.</Text>
                            <Text size="sm" tone="muted">Sahifa har 30 soniyada qayta tekshiradi.</Text>
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
                                <Text size="sm" tone="muted" className={styles.metaItem}>{formatDate(vod.startedAt)}</Text>
                                <Text size="sm" tone="muted" className={styles.metaItem}>{formatDuration(vod.startedAt, vod.endedAt)}</Text>
                                <Text size="sm" tone="muted" className={styles.metaItem}>Eng koʻp {formatCount(vod.peakViewers)} tomoshabin</Text>
                            </div>
                        </div>
                    </div>
                    {isOwn && (
                        <div className={styles.actions}>
                            <ConfirmButton
                                variant="secondary"
                                leftIcon={<Icon name="trash" size={16} />}
                                confirmLabel="Videoni oʻchirish"
                                loading={remove.isPending}
                                onConfirm={() => remove.mutate(vod.id)}
                            >
                                Oʻchirish
                            </ConfirmButton>
                        </div>
                    )}
                </div>

                {remove.isError && <Alert>{getErrorMessage(remove.error, 'Videoni oʻchirib boʻlmadi.')}</Alert>}

                <div className={styles.more}>
                    <VodGrid userId={vod.userId} title="Shu streamerning boshqa videolari" limit={8} excludeId={vod.id} hideWhenEmpty />
                </div>
            </div>
            <ChatPanel streamId={vod.id} ownerId={vod.userId} live={false} className={styles.chat} />
        </div>
    )
}
