import { Link } from 'react-router'
import { getErrorMessage } from '@/api/errors'
import { Badge, Button, Card, Heading, Skeleton, Text } from '@/components/atoms'
import { Alert, EmptyState } from '@/components/molecules'
import { useStreamEarnings } from '@/features/donations'
import { formatDate, formatSom } from '@/lib/format'
import { flattenPages } from '@/lib/pagination'
import { paths } from '@/routes/paths'
import styles from './StreamEarnings.module.css'

/**
 * Earnings per broadcast, the live one first. Only streams with a paid donation are listed.
 * @param {{onSelect: (stream: {streamId: string, title: string | null}) => void}} props shows that stream's donations
 */
export function StreamEarnings({ onSelect }) {
    const query = useStreamEarnings()
    const streams = flattenPages(query.data)

    return (
        <Card className={styles.card}>
            <Heading level={3}>Streamlar boʻyicha</Heading>

            {query.isPending && [0, 1, 2].map((i) => <Skeleton key={i} style={{ height: '5.2rem' }} />)}
            {query.isError && (
                <Alert>
                    {getErrorMessage(query.error, 'Roʻyxatni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => query.refetch()}>Qayta urinish</Button>
                </Alert>
            )}
            {query.isSuccess && streams.length === 0 && (
                <EmptyState icon="video" title="Hali daromad yoʻq" description="Donat olgan streamlaringiz shu yerda koʻrinadi." />
            )}

            {streams.length > 0 && (
                <ul className={styles.list}>
                    {streams.map((stream) => (
                        <li key={stream.streamId} className={styles.row}>
                            <div className={styles.body}>
                                <div className={styles.line}>
                                    {stream.live && <Badge variant="live">Live</Badge>}
                                    {stream.title ? (
                                        <Link to={stream.live ? paths.stream(stream.streamId) : paths.vod(stream.streamId)} className={styles.title}>
                                            {stream.title}
                                        </Link>
                                    ) : (
                                        <Text tone="muted" truncate>Oʻchirilgan video</Text>
                                    )}
                                </div>
                                <Text size="xs" tone="subtle">
                                    {stream.startedAt ? formatDate(stream.startedAt) : 'Sana nomaʼlum'} · {stream.count} ta donat
                                </Text>
                            </div>
                            <Text weight="bold" className={styles.amount}>{formatSom(stream.amount)}</Text>
                            <Button size="sm" variant="secondary" onClick={() => onSelect({ streamId: stream.streamId, title: stream.title })}>
                                Donatlar
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            {query.hasNextPage && (
                <Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()} className={styles.more}>
                    Yana yuklash
                </Button>
            )}
        </Card>
    )
}
