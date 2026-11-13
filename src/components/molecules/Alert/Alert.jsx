import { Icon } from '@/components/atoms'
import { cn } from '@/lib/cn'
import styles from './Alert.module.css'

const ICONS = { error: 'alert', info: 'alert', success: 'checkCircle' }

/** @param {{variant?: 'error' | 'info' | 'success', children: React.ReactNode, className?: string}} props */
export function Alert({ variant = 'error', children, className }) {
    return (
        <div role={variant === 'error' ? 'alert' : 'status'} className={cn(styles.alert, styles[variant], className)}>
            <Icon name={ICONS[variant]} size={18} className={styles.icon} />
            <div className={styles.content}>{children}</div>
        </div>
    )
}
