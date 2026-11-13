import { Heading, Text } from '@/components/atoms'
import { StreamKeyCard } from '@/components/organisms'
import styles from './StreamSettingsPage.module.css'

export function StreamSettingsPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Heading level={1}>Stream sozlamalari</Heading>
                <Text tone="muted" size="lg">Encoder’ingizni (masalan, OBS) server manzili va stream key orqali ulang.</Text>
            </header>
            <StreamKeyCard />
        </div>
    )
}
