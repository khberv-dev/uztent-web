import { cn } from '@/lib/cn'
import { Spinner } from '../Spinner'
import styles from './Button.module.css'

/**
 * @param {{
 *   variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger',
 *   size?: 'sm' | 'md' | 'lg',
 *   fullWidth?: boolean,
 *   loading?: boolean,
 *   leftIcon?: React.ReactNode,
 *   rightIcon?: React.ReactNode,
 *   as?: React.ElementType,
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 *
 * Use `as={Link} to="/path"` for navigation styled as a button (keeps valid HTML: no <button> inside <a>).
 */
export function Button({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    children,
    type = 'button',
    as: Component = 'button',
    ...rest
}) {
    const isButton = Component === 'button'
    return (
        <Component
            type={isButton ? type : undefined}
            className={cn(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className)}
            disabled={isButton ? disabled || loading : undefined}
            aria-disabled={!isButton && (disabled || loading) ? true : undefined}
            aria-busy={loading || undefined}
            {...rest}
        >
            {loading ? <Spinner size="sm" /> : leftIcon}
            {children && <span className={styles.label}>{children}</span>}
            {!loading && rightIcon}
        </Component>
    )
}
