import { useState } from 'react'
import { getErrorMessage } from '@/api/errors'
import { Avatar, Button, Skeleton, Text } from '@/components/atoms'
import { Alert, Modal } from '@/components/molecules'
import { followName, useFollowers, useFollowStatus } from '@/features/follows'
import { formatCount, formatTimeAgo } from '@/lib/format'
import { flattenPages } from '@/lib/pagination'
import styles from './FollowersCount.module.css'

function FollowersList({ userId }) {
    const query = useFollowers(userId)
    const followers = flattenPages(query.data)

    if (query.isPending) return [0, 1, 2].map((i) => <Skeleton key={i} style={{ height: '4.4rem' }} />)
    if (query.isError) {
        return (
            <Alert>
                {getErrorMessage(query.error, 'Roʻyxatni yuklab boʻlmadi.')}{' '}
                <Button variant="ghost" size="sm" onClick={() => query.refetch()}>Qayta urinish</Button>
            </Alert>
        )
    }
    if (followers.length === 0) return <Text tone="muted">Hali obunachilar yoʻq.</Text>

    return (
        <>
            <ul className={styles.list}>
                {followers.map((user) => (
                    <li key={user.userId} className={styles.row}>
                        <Avatar name={followName(user)} size="sm" />
                        <Text weight="semibold" truncate className={styles.name}>{followName(user)}</Text>
                        <Text size="xs" tone="subtle" className={styles.since}>{formatTimeAgo(user.since)}</Text>
                    </li>
                ))}
            </ul>
            {query.hasNextPage && (
                <Button variant="secondary" size="sm" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()} className={styles.more}>
                    Yana yuklash
                </Button>
            )}
        </>
    )
}

/**
 * "128 obunachi": opens the list of followers (public).
 * @param {{userId: string, name: string}} props name: whose followers, for the dialog title
 */
export function FollowersCount({ userId, name }) {
    const [open, setOpen] = useState(false)
    const { data: status } = useFollowStatus(userId)

    if (!status) return null
    return (
        <>
            <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
                {formatCount(status.followersCount)} obunachi
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title={`${name}: obunachilar`}>
                <div className={styles.body}>{open && <FollowersList userId={userId} />}</div>
            </Modal>
        </>
    )
}
