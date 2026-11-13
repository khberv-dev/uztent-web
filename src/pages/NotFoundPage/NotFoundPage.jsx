import { useNavigate } from 'react-router'
import { Button, Heading, Logo, Text } from '@/components/atoms'
import { paths } from '@/routes/paths'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <main className={styles.page}>
            <Logo size={48} />
            <Heading level={1}>404</Heading>
            <Text tone="muted" size="lg">Kechirasiz, bunday sahifa mavjud emas.</Text>
            <Button size="lg" onClick={() => navigate(paths.home)}>Bosh sahifaga</Button>
        </main>
    )
}
