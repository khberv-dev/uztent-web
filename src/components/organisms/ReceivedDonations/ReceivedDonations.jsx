import { useState } from 'react'
import { getErrorMessage } from '@/api/errors'
import { Button, Card, Heading, Icon, Skeleton, Text } from '@/components/atoms'
import { Alert, ChipGroup, EmptyState } from '@/components/molecules'
import { useReceivedDonations } from '@/features/donations'
import { cn } from '@/lib/cn'
import { formatDate, formatSom, formatTime } from '@/lib/format'
import { flattenPages } from '@/lib/pagination'
import styles from './ReceivedDonations.module.css'

const STATUSES = [
    { value: 'paid', label: 'Toʻlangan' },
    { value: 'pending', label: 'Kutilmoqda' },
    { value: 'expired', label: 'Muddati oʻtgan' },
    { value: 'failed', label: 'Xato' },
    { value: 'all', label: 'Hammasi' },
]
const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]))

const EMPTY_TEXT = {
    paid: 'Hali toʻlangan donatlar yoʻq.',
    pending: 'Toʻlovi kutilayotgan donatlar yoʻq.',
    expired: 'Muddati oʻtgan donatlar yoʻq.',
    failed: 'Xato bilan tugagan donatlar yoʻq.',
    all: 'Hali donatlar yoʻq.',
}

/**
 * Donations the streamer received, filtered by status and optionally by one stream.
 * @param {{stream?: {streamId: string, title: string | null} | null, onClearStream?: () => void}} props
 */
export function ReceivedDonations({ stream, onClearStream }) {
    const [status, setStatus] = useState('paid')
    const query = useReceivedDonations({ status, streamId: stream?.streamId })
    const donations = flattenPages(query.data)
    const total = query.data?.pages[0]?.total ?? 0

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Heading level={3}>Donatlar{query.data && <Text as="span" tone="muted" className={styles.total}> · {total}</Text>}</Heading>
                {stream && (
                    <button type="button" className={styles.streamFilter} onClick={onClearStream} title="Filtrni olib tashlash">
                        <Icon name="video" size={14} />
                        <span className={styles.streamTitle}>{stream.title ?? 'Oʻchirilgan video'}</span>
                        <Icon name="close" size={14} />
                    </button>
                )}
            </div>
            <ChipGroup label="Holat" options={STATUSES} value={status} onChange={setStatus} />

            {query.isPending && [0, 1, 2].map((i) => <Skeleton key={i} style={{ height: '5.2rem' }} />)}
            {query.isError && (
                <Alert>
                    {getErrorMessage(query.error, 'Donatlarni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => query.refetch()}>Qayta urinish</Button>
                </Alert>
            )}
            {query.isSuccess && donations.length === 0 && <EmptyState icon="gift" title={EMPTY_TEXT[status]} />}

            {donations.length > 0 && (
                <ul className={styles.list}>
                    {donations.map((donation) => {
                        const at = donation.paidAt ?? donation.createdAt
                        return (
                            <li key={donation.id} className={styles.row}>
                                <span className={cn(styles.icon, donation.status !== 'paid' && styles.muted)}><Icon name="gift" size={16} /></span>
                                <div className={styles.body}>
                                    <div className={styles.line}>
                                        <Text weight="semibold" truncate>{donation.donorName ?? 'Anonim'}</Text>
                                        {donation.status !== 'paid' && (
                                            <span className={cn(styles.status, styles[donation.status])}>{STATUS_LABELS[donation.status] ?? donation.status}</span>
                                        )}
                                    </div>
                                    {donation.message && <Text size="sm" className={styles.message}>{donation.message}</Text>}
                                    <Text size="xs" tone="subtle">
                                        {formatDate(at)}, {formatTime(at)}
                                        {donation.paymentSystem && ` · ${donation.paymentSystem.toUpperCase()}`}
                                    </Text>
                                </div>
                                <Text weight="bold" className={cn(styles.amount, donation.status !== 'paid' && styles.unpaid)}>
                                    {formatSom(donation.amount)}
                                </Text>
                            </li>
                        )
                    })}
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
