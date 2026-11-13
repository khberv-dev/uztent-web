import { Link } from 'react-router'
import { Avatar, Text } from '@/components/atoms'
import { cn } from '@/lib/cn'
import styles from './ChannelListItem.module.css'

/**
 * Sidebar row: avatar, name, category, live viewer count. Collapsed mode shows the avatar only.
 * @param {{to: string, name: string, category?: string, viewers?: string, live?: boolean, avatarUrl?: string, collapsed?: boolean}} props
 */
export function ChannelListItem({ to, name, category, viewers, live = false, avatarUrl, collapsed = false }) {
    return (
        <Link to={to} className={cn(styles.item, collapsed && styles.collapsed)} title={collapsed ? name : undefined}>
            <Avatar src={avatarUrl} name={name} size="sm" />
            {!collapsed && (
                <>
                    <div className={styles.info}>
                        <Text size="md" weight="semibold" truncate>{name}</Text>
                        {category && <Text size="sm" tone="muted" truncate>{category}</Text>}
                    </div>
                    <div className={styles.status}>
                        {live ? (
                            <>
                                <span className={styles.dot} aria-hidden="true" />
                                <Text as="span" size="sm">{viewers}</Text>
                            </>
                        ) : (
                            <Text as="span" size="sm" tone="muted">Offline</Text>
                        )}
                    </div>
                </>
            )}
        </Link>
    )
}
