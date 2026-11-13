import { cn } from '@/lib/cn'
import styles from './Badge.module.css'

/** @param {{variant?: 'live' | 'primary' | 'neutral' | 'overlay'} & React.HTMLAttributes<HTMLSpanElement>} props */
export function Badge({ variant = 'neutral', className, ...rest }) {
    return <span className={cn(styles.badge, styles[variant], className)} {...rest} />
}
