import { getErrorMessage } from '@/api/errors'
import { Button, Card, Heading, Icon, Skeleton, Text } from '@/components/atoms'
import { Alert } from '@/components/molecules'
import { useStreamDonations } from '@/features/donations'
import { formatSom, formatTimeAgo } from '@/lib/format'
import styles from './RecentDonations.module.css'

/** Paid donations of one stream, newest first; new ones arrive live via `donation.received`. */
export function RecentDonations({ streamId }) {
    const { data, isPending, isError, error, refetch } = useStreamDonations(streamId)
    const total = data?.reduce((sum, donation) => sum + donation.amount, 0) ?? 0

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Heading level={3}>Donatlar</Heading>
                {data?.length > 0 && <Text size="sm" tone="muted">Jami: {formatSom(total)}</Text>}
            </div>

            {isPending && [0, 1].map((i) => <Skeleton key={i} style={{ height: '4.4rem' }} />)}
            {isError && (
                <Alert>
                    {getErrorMessage(error, 'Donatlarni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                </Alert>
            )}
            {data?.length === 0 && <Text size="sm" tone="muted">Bu streamda hali donat yoʻq.</Text>}

            {data?.length > 0 && (
                <ul className={styles.list}>
                    {data.map((donation) => (
                        <li key={donation.id} className={styles.row}>
                            <span className={styles.icon}><Icon name="gift" size={16} /></span>
                            <div className={styles.body}>
                                <Text weight="semibold">
                                    {donation.donorName ?? 'Anonim'} <span className={styles.amount}>{formatSom(donation.amount)}</span>
                                </Text>
                                {donation.message && <Text size="sm" className={styles.message}>{donation.message}</Text>}
                            </div>
                            <Text size="xs" tone="subtle" className={styles.time}>{formatTimeAgo(donation.paidAt ?? donation.createdAt)}</Text>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}
