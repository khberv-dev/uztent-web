import { Link, useSearchParams } from 'react-router'
import { getErrorStatus } from '@/api/errors'
import { Button, Card, Heading, Icon, Spinner, Text } from '@/components/atoms'
import { useDonation } from '@/features/donations'
import { formatSom, isUuid } from '@/lib/format'
import { paths } from '@/routes/paths'
import styles from './DonationCompletePage.module.css'

function Result({ icon, tone, title, children, streamId }) {
    return (
        <Card className={styles.card}>
            {icon === 'spinner' ? <Spinner size="lg" /> : <span className={styles[tone]}><Icon name={icon} size={40} /></span>}
            <Heading level={2}>{title}</Heading>
            {children}
            <div className={styles.actions}>
                {streamId && <Button as={Link} to={paths.stream(streamId)}>Streamga qaytish</Button>}
                <Button as={Link} to={paths.home} variant="secondary">Bosh sahifa</Button>
            </div>
        </Card>
    )
}

/**
 * Multicard sends the donor here (?donationId=…) whether or not the payment succeeded, so the result
 * always comes from GET /donations/:id, polled while it's still `pending`.
 */
export function DonationCompletePage() {
    const [params] = useSearchParams()
    const id = params.get('donationId')
    const { data: donation, isPending, isError, error, polling } = useDonation(id)

    if (!isUuid(id) || getErrorStatus(error) === 404) {
        return (
            <div className={styles.page}>
                <Result icon="alert" tone="muted" title="Donat topilmadi">
                    <Text tone="muted">Havola notoʻgʻri yoki eskirgan.</Text>
                </Result>
            </div>
        )
    }

    if (isPending || (isError && !donation)) {
        return (
            <div className={styles.page}>
                <Result icon="spinner" title="Toʻlov tekshirilmoqda…">
                    <Text tone="muted">Bir necha soniya kuting.</Text>
                </Result>
            </div>
        )
    }

    const amount = formatSom(donation.amount)
    let result
    switch (donation.status) {
        case 'paid':
            result = (
                <Result icon="checkCircle" tone="success" title="Rahmat!" streamId={donation.streamId}>
                    <Text>{amount} donatingiz streamerga yuborildi.</Text>
                    {donation.message && <Text tone="muted" className={styles.message}>“{donation.message}”</Text>}
                </Result>
            )
            break
        case 'pending':
            result = polling ? (
                <Result icon="spinner" title="Toʻlov tasdiqlanishi kutilmoqda…" streamId={donation.streamId}>
                    <Text tone="muted">{amount}. Bu sahifa oʻzi yangilanadi.</Text>
                </Result>
            ) : (
                <Result icon="clock" tone="muted" title="Toʻlov hali tasdiqlanmadi" streamId={donation.streamId}>
                    <Text tone="muted">Agar toʻlagan boʻlsangiz, birozdan soʻng sahifani yangilang.</Text>
                </Result>
            )
            break
        case 'expired':
            result = (
                <Result icon="clock" tone="muted" title="Toʻlov muddati tugadi" streamId={donation.streamId}>
                    <Text tone="muted">{amount} toʻlanmadi. Qaytadan donat qilib koʻring.</Text>
                </Result>
            )
            break
        default:
            result = (
                <Result icon="alert" tone="danger" title="Toʻlov amalga oshmadi" streamId={donation.streamId}>
                    <Text tone="muted">Kartangizdan pul yechilmadi. Keyinroq qayta urinib koʻring.</Text>
                </Result>
            )
    }

    return <div className={styles.page}>{result}</div>
}
