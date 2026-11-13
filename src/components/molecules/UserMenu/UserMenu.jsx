import { useEffect, useRef, useState } from 'react'
import { Avatar, Divider, Icon, Text } from '@/components/atoms'
import styles from './UserMenu.module.css'

/**
 * Avatar button with a dropdown (profile summary + actions).
 * @param {{name: string, email?: string, avatarUrl?: string | null, items?: {icon: string, label: string, onSelect: () => void}[], onSignOut: () => void}} props
 */
export function UserMenu({ name, email, avatarUrl, items = [], onSignOut }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) return

        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) setOpen(false)
        }
        function handleKeyDown(event) {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    return (
        <div className={styles.root} ref={rootRef}>
            <button
                type="button"
                className={styles.trigger}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Foydalanuvchi menyusi"
                onClick={() => setOpen((value) => !value)}
            >
                <Avatar src={avatarUrl} name={name} size="sm" />
            </button>

            {open && (
                <div className={styles.menu} role="menu">
                    <div className={styles.header}>
                        <Avatar src={avatarUrl} name={name} size="md" />
                        <div className={styles.identity}>
                            <Text weight="semibold" truncate>{name}</Text>
                            {email && <Text size="sm" tone="muted" truncate>{email}</Text>}
                        </div>
                    </div>
                    <Divider className={styles.divider} />
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            className={styles.item}
                            onClick={() => {
                                setOpen(false)
                                item.onSelect()
                            }}
                        >
                            <Icon name={item.icon} size={18} /> {item.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        role="menuitem"
                        className={styles.item}
                        onClick={() => {
                            setOpen(false)
                            onSignOut()
                        }}
                    >
                        <Icon name="logout" size={18} /> Chiqish
                    </button>
                </div>
            )}
        </div>
    )
}
