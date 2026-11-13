import { cn } from '@/lib/cn'
import styles from './Spinner.module.css'

/** @param {{size?: 'sm' | 'md' | 'lg', className?: string, label?: string}} props */
export function Spinner({ size = 'md', className, label = 'Loading' }) {
    return <span role="status" aria-label={label} className={cn(styles.spinner, styles[size], className)} />
}
