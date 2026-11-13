import { useState } from 'react'
import { getErrorMessage } from '@/api/errors'
import { Avatar, Badge, Button, Card, Heading, Skeleton, Text } from '@/components/atoms'
import { Alert, ChipGroup, EmptyState } from '@/components/molecules'
import { useAddModerator, useModerators } from '@/features/chat'
import { useTopDonors } from '@/features/donations'
import { cn } from '@/lib/cn'
import { formatSom, formatTimeAgo } from '@/lib/format'
import styles from './TopDonors.module.css'

const PERIODS = [
    { value: 30, label: '30 kun' },
    { value: 0, label: 'Hammasi' },
]

const donorName = (donor) => donor.username ?? (`${donor.firstName} ${donor.lastName}`.trim() || 'Foydalanuvchi')

/** Biggest named supporters (anonymous donations never count), with a shortcut to make one a moderator. */
export function TopDonors() {
    const [days, setDays] = useState(30)
    const query = useTopDonors({ days: days || undefined })
    const moderators = useModerators()
    const moderatorIds = new Set(moderators.data?.map((m) => m.userId))
    const [error, setError] = useState(null)
    const promote = useAddModerator({ onError: (err) => setError(getErrorMessage(err, 'Moderator qoʻshib boʻlmadi.')) })

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Heading level={3}>Top donorlar</Heading>
                    <Text size="sm" tone="muted">Anonim donatlar hisobga olinmaydi.</Text>
                </div>
                <ChipGroup label="Davr" options={PERIODS} value={days} onChange={setDays} />
            </div>
            {error && <Alert>{error}</Alert>}

            {query.isPending && [0, 1, 2].map((i) => <Skeleton key={i} style={{ height: '5.2rem' }} />)}
            {query.isError && (
                <Alert>
                    {getErrorMessage(query.error, 'Roʻyxatni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => query.refetch()}>Qayta urinish</Button>
                </Alert>
            )}
            {query.isSuccess && query.data.length === 0 && (
                <EmptyState icon="users" title="Hali donorlar yoʻq" description={days ? 'Soʻnggi 30 kunda nomi bilan donat qilganlar yoʻq.' : undefined} />
            )}

            {query.data?.length > 0 && (
                <ol className={cn(styles.list, query.isPlaceholderData && styles.loading)}>
                    {query.data.map((donor, index) => (
                        <li key={donor.donorId} className={styles.row}>
                            <span className={cn(styles.rank, index < 3 && styles.podium)}>{index + 1}</span>
                            <Avatar name={donorName(donor)} size="sm" />
                            <div className={styles.body}>
                                <Text weight="semibold" truncate>{donorName(donor)}</Text>
                                <Text size="xs" tone="subtle">{donor.count} ta donat · oxirgisi {formatTimeAgo(donor.lastPaidAt)}</Text>
                            </div>
                            <Text weight="bold" className={styles.amount}>{formatSom(donor.amount)}</Text>
                            <div className={styles.action}>
                                {moderatorIds.has(donor.donorId) ? (
                                    <Badge variant="neutral">Moderator</Badge>
                                ) : (
                                    moderators.isSuccess && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            loading={promote.isPending && promote.variables === donor.donorId}
                                            onClick={() => {
                                                setError(null)
                                                promote.mutate(donor.donorId)
                                            }}
                                        >
                                            Moderator qilish
                                        </Button>
                                    )
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </Card>
    )
}
