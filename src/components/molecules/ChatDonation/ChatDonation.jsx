import { Icon } from '@/components/atoms'
import { formatSom, formatTime } from '@/lib/format'
import styles from './ChatDonation.module.css'

/**
 * A paid donation shown in the chat, highlighted like a pinned message.
 * @param {{donation: {donorName: string | null, amount: number, message: string | null, paidAt?: string | null, createdAt?: string}}} props
 */
export function ChatDonation({ donation }) {
    const time = donation.paidAt ?? donation.createdAt
    return (
        <div className={styles.donation} title={time ? formatTime(time) : undefined}>
            <p className={styles.head}>
                <span className={styles.icon}><Icon name="gift" size={14} strokeWidth={2.5} /></span>
                <span className={styles.donor}>{donation.donorName ?? 'Anonim'}</span>{' '}
                <span className={styles.amount}>{formatSom(donation.amount)}</span> donat qildi
            </p>
            {donation.message && <p className={styles.message}>{donation.message}</p>}
        </div>
    )
}
