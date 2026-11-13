import { Icon } from '@/components/atoms'
import { cn } from '@/lib/cn'
import styles from './StatCard.module.css'

/**
 * Compact metric tile (Twitch stream-manager style): icon, bold value, small label underneath.
 * @param {{icon: string, label: string, value: React.ReactNode, hint?: string, active?: boolean, className?: string}} props
 *   hint: extra explanation, shown as a tooltip
 *   active: accent styling (e.g. while live)
 */
export function StatCard({ icon, label, value, hint, active = false, className }) {
    return (
        <div className={cn(styles.card, active && styles.active, className)} title={hint}>
            <span className={styles.icon}><Icon name={icon} size={18} /></span>
            <div className={styles.text}>
                <span className={styles.value}>{value}</span>
                <span className={styles.label}>{label}</span>
            </div>
        </div>
    )
}
