import { useState } from 'react'
import { getErrorMessage } from '@/api/errors'
import { Button, Card, Heading, Skeleton, Text } from '@/components/atoms'
import { Alert, ChipGroup } from '@/components/molecules'
import { useDailyEarnings } from '@/features/donations'
import { cn } from '@/lib/cn'
import { formatDate, formatSom } from '@/lib/format'
import styles from './EarningsChart.module.css'

const PERIODS = [
    { value: 7, label: '7 kun' },
    { value: 30, label: '30 kun' },
    { value: 90, label: '90 kun' },
]

/** "2026-11-12" (a Tashkent calendar day) → "12-noyabr" */
function formatDay(day) {
    const [y, m, d] = day.split('-').map(Number)
    return formatDate(new Date(y, m - 1, d).toISOString())
}

/** Paid totals per day as bars. Hovering or tapping a bar shows that day. */
export function EarningsChart() {
    const [days, setDays] = useState(30)
    const [activeDay, setActiveDay] = useState(null)
    const { data, isPending, isError, error, refetch, isPlaceholderData } = useDailyEarnings(days)

    const total = data?.reduce((sum, day) => sum + day.amount, 0) ?? 0
    const count = data?.reduce((sum, day) => sum + day.count, 0) ?? 0
    const max = Math.max(1, ...(data?.map((day) => day.amount) ?? []))
    const active = data?.find((day) => day.date === activeDay)

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Heading level={3}>Kunlik daromad</Heading>
                    <Text size="sm" tone="muted" aria-live="polite">
                        {active
                            ? `${formatDay(active.date)}: ${formatSom(active.amount)} · ${active.count} ta donat`
                            : data
                                ? `${days} kunda: ${formatSom(total)} · ${count} ta donat`
                                : ' '}
                    </Text>
                </div>
                <ChipGroup
                    label="Davr"
                    options={PERIODS}
                    value={days}
                    onChange={(value) => {
                        setDays(value)
                        setActiveDay(null)
                    }}
                />
            </div>

            {isPending ? (
                <Skeleton style={{ height: '18rem' }} />
            ) : isError ? (
                <Alert>
                    {getErrorMessage(error, 'Grafikni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                </Alert>
            ) : (
                <div className={cn(styles.chart, isPlaceholderData && styles.loading)}>
                    <div
                        className={styles.bars}
                        role="img"
                        aria-label={`Soʻnggi ${days} kunlik daromad: jami ${formatSom(total)}`}
                        onPointerLeave={(event) => event.pointerType === 'mouse' && setActiveDay(null)}
                    >
                        {data.map((day) => (
                            <div
                                key={day.date}
                                className={cn(styles.slot, day.date === activeDay && styles.active)}
                                onPointerEnter={(event) => event.pointerType === 'mouse' && setActiveDay(day.date)}
                                onClick={() => setActiveDay((current) => (current === day.date ? null : day.date))}
                            >
                                <div
                                    className={cn(styles.bar, day.amount === 0 && styles.empty)}
                                    style={{ height: day.amount ? `max(0.4rem, ${(day.amount / max) * 100}%)` : undefined }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className={styles.axis} aria-hidden="true">
                        <span>{formatDay(data[0].date)}</span>
                        <span>{formatDay(data[data.length - 1].date)}</span>
                    </div>
                </div>
            )}
        </Card>
    )
}
