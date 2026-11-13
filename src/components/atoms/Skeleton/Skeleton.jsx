import { cn } from '@/lib/cn'
import styles from './Skeleton.module.css'

/** Loading placeholder. Size it with width/height/aspectRatio via `style`, or a className. */
export function Skeleton({ circle = false, className, style }) {
    return <span aria-hidden="true" className={cn(styles.skeleton, circle && styles.circle, className)} style={style} />
}
