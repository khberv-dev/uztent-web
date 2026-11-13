import { cn } from '@/lib/cn'
import styles from './Logo.module.css'

/** Brand mark, optionally with the wordmark. */
export function Logo({ withText = false, size = 32, className }) {
    return (
        <span className={cn(styles.logo, className)}>
            <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
                <path d="M9 8v11a5 5 0 0 0 5 5h4a5 5 0 0 0 5-5V8h-4v11a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V8z" fill="#fff" />
            </svg>
            {withText ? <span className={styles.text}>uztent</span> : <span className={styles.srOnly}>uztent</span>}
        </span>
    )
}
