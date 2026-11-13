import { Heading, Text } from '@/components/atoms'
import { VodGrid } from '@/components/organisms'
import styles from './VideosPage.module.css'

export function VideosPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <Heading level={1}>Videos</Heading>
                    <Text tone="muted" size="lg">Recordings of your past streams.</Text>
                </div>
            </header>
            <VodGrid
                emptyTitle="No recordings yet"
                emptyDescription="When you end a stream, its recording shows up here."
            />
        </div>
    )
}
