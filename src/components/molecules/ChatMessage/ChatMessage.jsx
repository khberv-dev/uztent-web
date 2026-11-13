import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { hueFromId } from '@/lib/format'
import styles from './ChatMessage.module.css'

const ROLE_BADGES = {
    streamer: { icon: 'broadcast', label: 'Streamer' },
    moderator: { icon: 'shield', label: 'Moderator' },
}

const timeFormat = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' })
const MENU_HEIGHT_GUESS = 140 // px; opens upwards when there isn't this much room below

/**
 * One chat line (Twitch style): role badge, sender name in a stable per-user color, text.
 * `actions` go in a "⋯" menu that appears on hover/focus. `children` render under the line
 * (e.g. a confirmation).
 * @param {{
 *   message: import('@/api/chat').ChatMessage,
 *   own?: boolean,
 *   actions?: {icon: string, label: string, onSelect: () => void, danger?: boolean}[],
 *   children?: React.ReactNode,
 * }} props
 */
export function ChatMessage({ message, own = false, actions = [], children }) {
    const badge = ROLE_BADGES[message.senderRole]
    const [menu, setMenu] = useState(null) // fixed position of the open menu
    const rootRef = useRef(null)
    const triggerRef = useRef(null)

    useEffect(() => {
        if (!menu) return undefined
        const close = () => setMenu(null)
        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) close()
        }
        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                close()
                triggerRef.current?.focus()
            }
        }
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        // The menu is fixed-positioned (so the chat's scroll box can't clip it): close it on scroll/resize
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [menu])

    function toggleMenu() {
        if (menu) return setMenu(null)
        const rect = triggerRef.current.getBoundingClientRect()
        const right = window.innerWidth - rect.right
        const openUp = rect.bottom + MENU_HEIGHT_GUESS > window.innerHeight
        return setMenu(openUp ? { right, bottom: window.innerHeight - rect.top + 4 } : { right, top: rect.bottom + 4 })
    }

    return (
        <div
            ref={rootRef}
            className={cn(styles.message, own && styles.own, menu && styles.menuOpen)}
            title={timeFormat.format(new Date(message.createdAt))}
        >
            <p className={styles.body}>
                {badge && (
                    <span className={cn(styles.badge, styles[message.senderRole])} title={badge.label} aria-label={badge.label}>
                        <Icon name={badge.icon} size={12} strokeWidth={2.5} />
                    </span>
                )}
                <span className={styles.name} style={{ '--hue': hueFromId(message.userId) }}>{message.senderName}</span>
                <span className={styles.colon}>: </span>
                <span className={styles.text}>{message.text}</span>
            </p>

            {actions.length > 0 && (
                <>
                    <button
                        ref={triggerRef}
                        type="button"
                        className={styles.trigger}
                        aria-label={`Actions for ${message.senderName}’s message`}
                        title="More actions"
                        aria-haspopup="menu"
                        aria-expanded={Boolean(menu)}
                        onClick={toggleMenu}
                    >
                        <Icon name="moreHorizontal" size={16} />
                    </button>
                    {menu && (
                        <div className={styles.menu} role="menu" style={menu}>
                            {actions.map((action) => (
                                <button
                                    key={action.label}
                                    type="button"
                                    role="menuitem"
                                    className={cn(styles.item, action.danger && styles.danger)}
                                    onClick={() => {
                                        setMenu(null)
                                        action.onSelect()
                                    }}
                                >
                                    <Icon name={action.icon} size={16} /> {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {children && <div className={styles.extra}>{children}</div>}
        </div>
    )
}
