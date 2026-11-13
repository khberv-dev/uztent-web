import { useState } from 'react'
import { Heading, Text } from '@/components/atoms'
import { EarningsChart, EarningsSummary, ReceivedDonations, StreamEarnings, TopDonors } from '@/components/organisms'
import { cn } from '@/lib/cn'
import styles from './EarningsPage.module.css'

const TABS = [
    { id: 'donations', label: 'Donatlar' },
    { id: 'streams', label: 'Streamlar' },
    { id: 'donors', label: 'Top donorlar' },
]

/** The streamer's earnings from donations (/monetization/*). */
export function EarningsPage() {
    const [tab, setTab] = useState('donations')
    // Picking a stream on the "Streamlar" tab shows its donations
    const [stream, setStream] = useState(null)

    return (
        <div className={styles.page}>
            <header>
                <Heading level={1}>Daromad</Heading>
                <Text tone="muted" size="lg">Donatlardan tushgan pul. Kunlar Toshkent vaqti bilan hisoblanadi.</Text>
            </header>

            <EarningsSummary />
            <EarningsChart />

            <div className={styles.tabs} role="tablist" aria-label="Daromad boʻlimlari">
                {TABS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        id={`earnings-tab-${item.id}`}
                        aria-selected={tab === item.id}
                        aria-controls="earnings-panel"
                        className={cn(styles.tab, tab === item.id && styles.activeTab)}
                        onClick={() => setTab(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div id="earnings-panel" role="tabpanel" aria-labelledby={`earnings-tab-${tab}`}>
                {tab === 'donations' && <ReceivedDonations stream={stream} onClearStream={() => setStream(null)} />}
                {tab === 'streams' && (
                    <StreamEarnings
                        onSelect={(selected) => {
                            setStream(selected)
                            setTab('donations')
                        }}
                    />
                )}
                {tab === 'donors' && <TopDonors />}
            </div>
        </div>
    )
}
