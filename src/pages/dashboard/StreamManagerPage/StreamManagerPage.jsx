import { ChatPanel, GoLivePanel, RecentDonations } from '@/components/organisms'
import { useMyLiveStream } from '@/features/streams'
import styles from './StreamManagerPage.module.css'

/** Live status, stats and title, with the stream's chat docked on the right while live. */
export function StreamManagerPage() {
    const { data: stream } = useMyLiveStream()

    return (
        <div className={stream ? styles.withChat : styles.page}>
            <div className={styles.main}>
                <GoLivePanel />
                {stream && <RecentDonations key={stream.id} streamId={stream.id} />}
            </div>
            {stream && (
                <ChatPanel
                    key={stream.id}
                    streamId={stream.id}
                    ownerId={stream.userId}
                    live
                    slowModeSeconds={stream.chatSlowModeSeconds ?? 0}
                    className={styles.chat}
                />
            )}
        </div>
    )
}
