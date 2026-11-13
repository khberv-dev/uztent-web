import { cn } from '@/lib/cn'
import styles from './Logo.module.css'

/** Brand mark (public/uztent.png), optionally with the wordmark. */
export function Logo({ withText = false, size = 32, className }) {
    return (
        <span className={cn(styles.logo, className)}>
            <img src="/uztent.png" width={size} height={size} alt="" className={styles.mark} draggable={false} />
            {withText ? <span className={styles.text}>uztent</span> : <span className={styles.srOnly}>uztent</span>}
        </span>
    )
}
