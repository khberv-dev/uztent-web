import { getErrorMessage } from '@/api/errors'
import { Button, Skeleton } from '@/components/atoms'
import { Alert, StatCard } from '@/components/molecules'
import { useEarningsSummary } from '@/features/donations'
import { formatSom } from '@/lib/format'
import styles from './EarningsSummary.module.css'

const countLabel = (count) => `${count} ta donat`

/** Headline earnings: today, last 7 / 30 days, all time, average, largest, donors. */
export function EarningsSummary() {
    const { data, isPending, isError, error, refetch } = useEarningsSummary()

    if (isPending) {
        return (
            <div className={styles.grid}>
                {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} style={{ height: '5.4rem' }} />)}
            </div>
        )
    }
    if (isError) {
        return (
            <Alert>
                {getErrorMessage(error, 'Daromad maʼlumotlarini yuklab boʻlmadi.')}{' '}
                <Button variant="ghost" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
            </Alert>
        )
    }

    return (
        <div className={styles.grid}>
            <StatCard icon="wallet" label={`Bugun · ${countLabel(data.today.count)}`} value={formatSom(data.today.amount)} active={data.today.amount > 0} hint="Toshkent vaqti bilan 00:00 dan beri" />
            <StatCard icon="calendar" label={`Soʻnggi 7 kun · ${countLabel(data.last7Days.count)}`} value={formatSom(data.last7Days.amount)} />
            <StatCard icon="calendar" label={`Soʻnggi 30 kun · ${countLabel(data.last30Days.count)}`} value={formatSom(data.last30Days.amount)} />
            <StatCard icon="trendingUp" label={`Jami · ${countLabel(data.allTime.count)}`} value={formatSom(data.allTime.amount)} />
            <StatCard icon="gift" label="Oʻrtacha donat" value={formatSom(data.averageAmount)} />
            <StatCard
                icon="star"
                label={data.largest ? `Eng katta · ${data.largest.donorName ?? 'Anonim'}` : 'Eng katta donat'}
                value={formatSom(data.largest?.amount ?? 0)}
                hint={data.largest?.message ?? undefined}
            />
            <StatCard icon="users" label="Donorlar" value={data.donors} hint="Nomini yashirmagan, akkaunt bilan donat qilganlar" />
        </div>
    )
}
