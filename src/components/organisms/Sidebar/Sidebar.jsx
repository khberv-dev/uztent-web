import { Icon, IconButton, Skeleton, Text } from '@/components/atoms'
import { ChannelListItem } from '@/components/molecules'
import { streamerName, useLiveStreams } from '@/features/streams'
import { useMe } from '@/features/users'
import { cn } from '@/lib/cn'
import { formatCount, formatTimeAgo } from '@/lib/format'
import { flattenPages } from '@/lib/pagination'
import { paths } from '@/routes/paths'
import styles from './Sidebar.module.css'

/** "Live now" list: the first page of GET /streams (shares the cache with the home grid). */
export function Sidebar({ collapsed = false, onToggle }) {
    const { data: me } = useMe()
    const { data, isPending, isError } = useLiveStreams()
    const streams = flattenPages(data)

    return (
        <aside className={cn(styles.sidebar, collapsed && styles.collapsed)} aria-label="Live now">
            <div className={styles.header}>
                {!collapsed && (
                    <Text as="h2" size="sm" weight="bold" className={styles.heading}>
                        Live now
                    </Text>
                )}
                {onToggle && (
                    <IconButton
                        icon={collapsed ? 'expandRight' : 'collapseLeft'}
                        label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        size="sm"
                        onClick={onToggle}
                    />
                )}
            </div>

            {collapsed && (
                <div className={styles.collapsedIcon} title="Live now">
                    <Icon name="broadcast" size={18} />
                </div>
            )}

            {isPending && (
                <div className={styles.list}>
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className={styles.skeletonRow}>
                            <Skeleton circle style={{ width: '3rem', height: '3rem', flexShrink: 0 }} />
                            {!collapsed && <Skeleton style={{ height: '1.2rem', flex: 1 }} />}
                        </div>
                    ))}
                </div>
            )}

            {isError && !collapsed && (
                <Text size="sm" tone="muted" className={styles.message}>Couldn’t load live streams.</Text>
            )}

            {!isPending && !isError && streams.length === 0 && !collapsed && (
                <Text size="sm" tone="muted" className={styles.message}>No one is live right now.</Text>
            )}

            {streams.length > 0 && (
                <ul className={styles.list}>
                    {streams.map((stream) => (
                        <li key={stream.id}>
                            <ChannelListItem
                                to={paths.stream(stream.id)}
                                name={stream.title}
                                category={`${streamerName(stream.userId, me)} · ${formatTimeAgo(stream.startedAt)}`}
                                live
                                viewers={formatCount(stream.viewers)}
                                collapsed={collapsed}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    )
}
