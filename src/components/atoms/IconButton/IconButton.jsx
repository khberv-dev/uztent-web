import { cn } from '@/lib/cn'
import { Icon } from '../Icon'
import styles from './IconButton.module.css'

/**
 * Square, icon-only button. `label` is required for accessibility.
 * @param {{icon: string, label: string, size?: 'sm' | 'md' | 'lg', variant?: 'ghost' | 'secondary' | 'primary'} & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function IconButton({ icon, label, size = 'md', variant = 'ghost', className, type = 'button', ...rest }) {
    const iconSize = { sm: 16, md: 20, lg: 24 }[size]

    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            className={cn(styles.iconButton, styles[size], styles[variant], className)}
            {...rest}
        >
            <Icon name={icon} size={iconSize} />
        </button>
    )
}
