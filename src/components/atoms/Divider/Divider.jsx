import { cn } from '@/lib/cn'
import styles from './Divider.module.css'

/** Horizontal rule; pass children to render a centered label ("or"). */
export function Divider({ children, className }) {
    if (!children) return <hr className={cn(styles.line, className)} />

    return (
        <div className={cn(styles.labeled, className)} role="separator">
            <span>{children}</span>
        </div>
    )
}
