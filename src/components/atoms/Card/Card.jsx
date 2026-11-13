import { cn } from '@/lib/cn'
import styles from './Card.module.css'

/** Surface panel. @param {{as?: React.ElementType, padding?: 'md' | 'lg'} & React.HTMLAttributes<HTMLElement>} props */
export function Card({ as: Component = 'div', padding = 'lg', className, ...rest }) {
    return <Component className={cn(styles.card, styles[padding], className)} {...rest} />
}
