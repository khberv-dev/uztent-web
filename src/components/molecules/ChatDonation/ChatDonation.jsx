import { Icon } from '@/components/atoms'
import { formatSom } from '@/lib/format'
import styles from './ChatDonation.module.css'

const timeFormat = new Intl.DateTimeFormat('uz', { hour: '2-digit', minute: '2-digit' })

/**
 * A paid donation shown in the chat, highlighted like a pinned message.
 * @param {{donation: {donorName: string | null, amount: number, message: string | null, paidAt?: string | null, createdAt?: string}}} props
 */
export function ChatDonation({ donation }) {
    const time = donation.paidAt ?? donation.createdAt
    return (
        <div className={styles.donation} title={time ? timeFormat.format(new Date(time)) : undefined}>
            <p className={styles.head}>
                <span className={styles.icon}><Icon name="gift" size={14} strokeWidth={2.5} /></span>
                <span className={styles.donor}>{donation.donorName ?? 'Anonim'}</span>{' '}
                <span className={styles.amount}>{formatSom(donation.amount)}</span> donat qildi
            </p>
            {donation.message && <p className={styles.message}>{donation.message}</p>}
        </div>
    )
}
