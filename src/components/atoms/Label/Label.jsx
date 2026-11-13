import { cn } from '@/lib/cn'
import styles from './Label.module.css'

/** @param {{required?: boolean} & React.LabelHTMLAttributes<HTMLLabelElement>} props */
export function Label({ required = false, className, children, ...rest }) {
    return (
        <label className={cn(styles.label, className)} {...rest}>
            {children}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
    )
}
