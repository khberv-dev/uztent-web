import { Heading, Text } from '@/components/atoms'
import { StreamKeyCard } from '@/components/organisms'
import styles from './StreamSettingsPage.module.css'

export function StreamSettingsPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Heading level={1}>Stream settings</Heading>
                <Text tone="muted" size="lg">Connect your encoder (e.g. OBS) with your server address and stream key.</Text>
            </header>
            <StreamKeyCard />
        </div>
    )
}
