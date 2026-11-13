import { Heading, Text } from '@/components/atoms'
import { VodGrid } from '@/components/organisms'
import styles from './VideosPage.module.css'

export function VideosPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <Heading level={1}>Videolar</Heading>
                    <Text tone="muted" size="lg">Oldingi streamlaringiz yozuvlari.</Text>
                </div>
            </header>
            <VodGrid
                emptyTitle="Hali yozuvlar yoʻq"
                emptyDescription="Streamni tugatganingizda, uning yozuvi shu yerda paydo boʻladi."
            />
        </div>
    )
}
