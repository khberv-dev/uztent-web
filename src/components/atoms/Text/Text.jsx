import { cn } from '@/lib/cn'
import styles from './Text.module.css'

/**
 * @param {{
 *   as?: React.ElementType,
 *   size?: 'xs' | 'sm' | 'md' | 'lg',
 *   tone?: 'default' | 'muted' | 'subtle' | 'primary' | 'danger' | 'success',
 *   weight?: 'regular' | 'medium' | 'semibold' | 'bold',
 *   truncate?: boolean,
 * } & React.HTMLAttributes<HTMLElement>} props
 */
export function Text({ as: Component = 'p', size = 'md', tone = 'default', weight = 'regular', truncate, className, ...rest }) {
    return (
        <Component
            className={cn(styles[`size-${size}`], styles[`tone-${tone}`], styles[`weight-${weight}`], truncate && styles.truncate, className)}
            {...rest}
        />
    )
}

/** @param {{level?: 1 | 2 | 3 | 4} & React.HTMLAttributes<HTMLHeadingElement>} props */
export function Heading({ level = 2, className, ...rest }) {
    const Component = `h${level}`
    return <Component className={cn(styles.heading, styles[`h${level}`], className)} {...rest} />
}
