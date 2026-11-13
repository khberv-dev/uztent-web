import { useState } from 'react'
import { Button } from '@/components/atoms'
import styles from './ConfirmButton.module.css'

/**
 * Two-step destructive action: the first click asks for confirmation inline.
 * @param {{onConfirm: () => void, confirmLabel?: string, loading?: boolean} & React.ComponentProps<typeof Button>} props
 */
export function ConfirmButton({ onConfirm, confirmLabel = 'Tasdiqlash', loading = false, size = 'md', children, ...buttonProps }) {
    const [armed, setArmed] = useState(false)

    if (!armed && !loading) {
        return (
            <Button size={size} {...buttonProps} onClick={() => setArmed(true)}>
                {children}
            </Button>
        )
    }

    return (
        <span className={styles.group}>
            <Button size={size} variant="ghost" disabled={loading} onClick={() => setArmed(false)}>
                Bekor qilish
            </Button>
            <Button size={size} variant="danger" loading={loading} onClick={onConfirm} autoFocus>
                {confirmLabel}
            </Button>
        </span>
    )
}
