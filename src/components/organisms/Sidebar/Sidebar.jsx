import { Icon, IconButton, Skeleton, Text } from '@/components/atoms'
import { ChannelListItem } from '@/components/molecules'
import { followName, useFollowing } from '@/features/follows'
import { streamerName, useLiveStreams } from '@/features/streams'
import { useMe } from '@/features/users'
import { cn } from '@/lib/cn'
import { formatCount, formatTimeAgo } from '@/lib/format'
import { flattenPages } from '@/lib/pagination'
import { paths } from '@/routes/paths'
import styles from './Sidebar.module.css'

const MAX_FOLLOWED = 10

/**
 * Followed channels (signed in), live ones first, then "Live now": the first page of GET /streams
 * (shares the cache with the home grid).
 */
export function Sidebar({ collapsed = false, onToggle }) {
    const { data: me } = useMe()
    const { data, isPending, isError } = useLiveStreams()
    const streams = flattenPages(data)
    const following = flattenPages(useFollowing(me?.id, { limit: 50 }).data)

    // Follow lists carry names, which streams don't: name followed streamers in both lists
    const followedNames = new Map(following.map((user) => [user.userId, followName(user)]))
    const nameOf = (userId) => followedNames.get(userId) ?? streamerName(userId, me)
    const liveByUser = new Map(streams.map((stream) => [stream.userId, stream]))
    const followed = following
        .map((user) => ({ user, stream: liveByUser.get(user.userId) }))
        // Offline channels open their /w/:username page, so those without a username can't be listed
        .filter(({ user, stream }) => stream || user.username)
        .sort((a, b) => Boolean(b.stream) - Boolean(a.stream) || (b.stream?.viewers ?? 0) - (a.stream?.viewers ?? 0))
        .slice(0, MAX_FOLLOWED)

    return (
        <aside className={cn(styles.sidebar, collapsed && styles.collapsed)} aria-label="Kanallar">
            <div className={styles.header}>
                {!collapsed && (
                    <Text as="h2" size="sm" weight="bold" className={styles.heading}>
                        {followed.length > 0 ? 'Obunalar' : 'Hozir live’da'}
                    </Text>
                )}
                {onToggle && (
                    <IconButton
                        icon={collapsed ? 'expandRight' : 'collapseLeft'}
                        label={collapsed ? 'Yon panelni ochish' : 'Yon panelni yigʻish'}
                        size="sm"
                        onClick={onToggle}
                    />
                )}
            </div>

            {followed.length > 0 && (
                <section aria-label="Obunalar" className={styles.section}>
                    {collapsed && <div className={styles.collapsedIcon} title="Obunalar"><Icon name="heart" size={18} /></div>}
                    <ul className={styles.list}>
                        {followed.map(({ user, stream }) => (
                            <li key={user.userId}>
                                <ChannelListItem
                                    to={stream ? paths.stream(stream.id) : paths.channel(user.username)}
                                    name={followName(user)}
                                    category={stream?.title}
                                    live={Boolean(stream)}
                                    viewers={stream ? formatCount(stream.viewers) : undefined}
                                    collapsed={collapsed}
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {followed.length > 0 && !collapsed && (
                <Text as="h2" size="sm" weight="bold" className={cn(styles.heading, styles.sectionHeading)}>Hozir live’da</Text>
            )}

            {collapsed && (
                <div className={styles.collapsedIcon} title="Hozir live’da">
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
                <Text size="sm" tone="muted" className={styles.message}>Live streamlarni yuklab boʻlmadi.</Text>
            )}

            {!isPending && !isError && streams.length === 0 && !collapsed && (
                <Text size="sm" tone="muted" className={styles.message}>Hozir hech kim live’da emas.</Text>
            )}

            {streams.length > 0 && (
                <ul className={styles.list}>
                    {streams.map((stream) => (
                        <li key={stream.id}>
                            <ChannelListItem
                                to={paths.stream(stream.id)}
                                name={stream.title}
                                category={`${nameOf(stream.userId)} · ${formatTimeAgo(stream.startedAt)}`}
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
