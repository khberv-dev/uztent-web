import { cn } from '@/lib/cn'
import styles from './Input.module.css'

/**
 * Text input. Pass `invalid` to show the error state; pair with <Label> / <FormField>.
 * @param {{invalid?: boolean, size?: 'md' | 'lg', leftSlot?: React.ReactNode, rightSlot?: React.ReactNode, ref?: React.Ref<HTMLInputElement>} & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export function Input({ invalid = false, size = 'md', leftSlot, rightSlot, className, ref, ...rest }) {
    return (
        <div className={cn(styles.wrapper, styles[size], invalid && styles.invalid, rest.disabled && styles.disabled, className)}>
            {leftSlot && <span className={styles.slot}>{leftSlot}</span>}
            <input ref={ref} className={styles.input} aria-invalid={invalid || undefined} {...rest} />
            {rightSlot && <span className={styles.slot}>{rightSlot}</span>}
        </div>
    )
}
