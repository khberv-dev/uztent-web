import { useEffect } from 'react'
import { DonationAlert } from '@/components/molecules'
import { useChatRoom } from '@/features/chat'
import { dismissDonationAlert, useDonationAlertQueue } from '@/features/donations'
import styles from './DonationAlerts.module.css'

const SHOW_MS = 7000

/**
 * Shows `donation.received` alerts for one stream, one at a time, over the player.
 * Place it inside a `position: relative` box. Joins the stream room itself, so it works without the chat.
 */
export function DonationAlerts({ streamId }) {
    useChatRoom(streamId)
    const queue = useDonationAlertQueue(streamId)
    const current = queue[0]

    useEffect(() => {
        if (!current) return undefined
        const timer = setTimeout(() => dismissDonationAlert(streamId, current.id), SHOW_MS)
        return () => clearTimeout(timer)
    }, [current, streamId])

    if (!current) return null
    return (
        <div className={styles.layer}>
            <DonationAlert key={current.id} donation={current} />
        </div>
    )
}
