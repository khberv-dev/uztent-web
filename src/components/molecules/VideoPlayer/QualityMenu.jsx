import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms'
import { cn } from '@/lib/cn'
import styles from './VideoPlayer.module.css'

/**
 * Settings button with a quality list.
 * @param {{qualities: string[], quality: string, onChange: (quality: string) => void, onOpenChange?: (open: boolean) => void}} props
 */
export function QualityMenu({ qualities, quality, onChange, onOpenChange }) {
    const [open, setOpenState] = useState(false)
    const rootRef = useRef(null)

    const setOpen = (value) => {
        setOpenState(value)
        onOpenChange?.(value)
    }

    useEffect(() => {
        if (!open) return undefined
        const close = (event) => {
            if (event.type === 'keydown' && event.key !== 'Escape') return
            if (event.type === 'pointerdown' && rootRef.current?.contains(event.target)) return
            setOpenState(false)
            onOpenChange?.(false)
        }
        document.addEventListener('pointerdown', close)
        document.addEventListener('keydown', close)
        return () => {
            document.removeEventListener('pointerdown', close)
            document.removeEventListener('keydown', close)
        }
    }, [open, onOpenChange])

    return (
        <div className={styles.menuRoot} ref={rootRef}>
            <button
                type="button"
                className={cn(styles.controlButton, open && styles.controlButtonActive)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Quality: ${quality}`}
                title="Quality"
                onClick={() => setOpen(!open)}
            >
                <Icon name="settings" size={20} />
                <span className={styles.qualityBadge}>{quality === 'Source' ? 'SRC' : quality}</span>
            </button>
            {open && (
                <div className={styles.menu} role="menu" aria-label="Quality">
                    <div className={styles.menuTitle}>Quality</div>
                    {qualities.map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="menuitemradio"
                            aria-checked={option === quality}
                            className={cn(styles.menuItem, option === quality && styles.menuItemSelected)}
                            onClick={() => {
                                onChange(option)
                                setOpen(false)
                            }}
                        >
                            <span className={styles.menuCheck}>{option === quality && <Icon name="check" size={16} />}</span>
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
