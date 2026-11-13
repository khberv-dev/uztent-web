import { Icon } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { formatSom } from '@/lib/format'
import styles from './DonationAlert.module.css'

/**
 * On-stream donation alert card: "<donor> <amount> donat qildi" plus the message.
 * @param {{donation: {donorName: string | null, amount: number, message: string | null}, className?: string}} props
 */
export function DonationAlert({ donation, className }) {
    return (
        <div className={cn(styles.alert, className)} role="status" aria-live="polite">
            <span className={styles.icon}><Icon name="gift" size={22} /></span>
            <div className={styles.text}>
                <p className={styles.title}>
                    <span className={styles.donor}>{donation.donorName ?? 'Anonim'}</span>{' '}
                    <span className={styles.amount}>{formatSom(donation.amount)}</span> donat qildi
                </p>
                {donation.message && <p className={styles.message}>{donation.message}</p>}
            </div>
        </div>
    )
}
