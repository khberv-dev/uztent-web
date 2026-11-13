import { useState } from 'react'
import { getErrorMessage } from '@/api/errors'
import { Button, Icon, Spinner, Text } from '@/components/atoms'
import { Alert, FormField, Modal } from '@/components/molecules'
import { DONATION_MAX, DONATION_MESSAGE_MAX, DONATION_MIN, useCreateDonation, useDonation } from '@/features/donations'
import { cn } from '@/lib/cn'
import { formatSom } from '@/lib/format'
import { useIsAuthenticated } from '@/lib/session'
import styles from './DonateButton.module.css'

const PRESETS = [5_000, 10_000, 20_000, 50_000, 100_000]

function validateAmount(raw) {
    const amount = Number(raw)
    if (!raw || !Number.isInteger(amount)) return 'Butun son kiriting.'
    if (amount < DONATION_MIN || amount > DONATION_MAX) {
        return `Summa ${formatSom(DONATION_MIN)} va ${formatSom(DONATION_MAX)} oraligʻida boʻlishi kerak.`
    }
    return null
}

/**
 * After the invoice is created: the checkout is open in another tab, and this follows the donation's
 * status (GET /donations/:id) so the modal can say when the payment went through.
 */
function CheckoutStatus({ donation, popupBlocked, onRetry }) {
    const { data, polling } = useDonation(donation.id)
    const status = data?.status ?? donation.status
    const amount = formatSom(donation.amount)
    const checkoutLink = donation.checkoutUrl && (
        <Button as="a" href={donation.checkoutUrl} target="_blank" rel="noopener noreferrer" variant={popupBlocked ? 'primary' : 'secondary'} fullWidth>
            Toʻlov sahifasini ochish
        </Button>
    )

    if (status === 'paid') {
        return (
            <div className={styles.status}>
                <span className={styles.success}><Icon name="checkCircle" size={40} /></span>
                <Text weight="semibold">Rahmat! {amount} donatingiz yuborildi.</Text>
            </div>
        )
    }
    if (status === 'pending') {
        return (
            <div className={styles.status}>
                {polling && !popupBlocked && <Spinner size="lg" />}
                <Text weight="semibold">
                    {popupBlocked ? 'Toʻlov sahifasini oching' : 'Toʻlov sahifasi yangi tabda ochildi'}
                </Text>
                <Text tone="muted">
                    {polling
                        ? `${amount} toʻlovini yakunlang. Toʻlov tasdiqlangach, bu oyna oʻzi yangilanadi.`
                        : 'Toʻlov hali tasdiqlanmadi. Toʻlagan boʻlsangiz, birozdan soʻng qayta tekshiring.'}
                </Text>
                {checkoutLink}
            </div>
        )
    }
    return (
        <div className={styles.status}>
            <span className={styles.danger}><Icon name="alert" size={40} /></span>
            <Text weight="semibold">{status === 'expired' ? 'Toʻlov muddati tugadi.' : 'Toʻlov amalga oshmadi.'}</Text>
            <Button onClick={onRetry} fullWidth>Qayta urinish</Button>
        </div>
    )
}

function DonateForm({ target }) {
    const authenticated = useIsAuthenticated()
    const [amount, setAmount] = useState('10000')
    const [message, setMessage] = useState('')
    const [anonymous, setAnonymous] = useState(false)
    const [amountError, setAmountError] = useState(null)
    const [popupBlocked, setPopupBlocked] = useState(false)

    const donate = useCreateDonation()

    function handleSubmit(event) {
        event.preventDefault()
        const error = validateAmount(amount)
        setAmountError(error)
        if (error) return
        // Open the tab now, while we're still inside the click: browsers block window.open after an
        // await. It gets the checkout URL once the invoice exists, or is closed if that fails.
        const checkoutTab = window.open('', '_blank')
        if (checkoutTab) {
            checkoutTab.opener = null
            checkoutTab.document.title = 'Toʻlov…'
        }
        setPopupBlocked(!checkoutTab)
        donate.mutate({
            target,
            amount: Number(amount),
            message: message.trim() || undefined,
            anonymous: authenticated ? anonymous : undefined, // guests are always anonymous
        }, {
            onSuccess: (donation) => {
                if (checkoutTab && donation.checkoutUrl) checkoutTab.location.href = donation.checkoutUrl
                else checkoutTab?.close()
            },
            onError: () => checkoutTab?.close(),
        })
    }

    if (donate.isSuccess) {
        return <CheckoutStatus donation={donate.data} popupBlocked={popupBlocked} onRetry={() => donate.reset()} />
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.presets} role="group" aria-label="Tayyor summalar">
                {PRESETS.map((preset) => (
                    <button
                        key={preset}
                        type="button"
                        className={cn(styles.preset, Number(amount) === preset && styles.selected)}
                        onClick={() => {
                            setAmount(String(preset))
                            setAmountError(null)
                        }}
                    >
                        {formatSom(preset)}
                    </button>
                ))}
            </div>

            <FormField
                label="Summa (soʻm)"
                required
                type="number"
                inputMode="numeric"
                min={DONATION_MIN}
                max={DONATION_MAX}
                step={1000}
                value={amount}
                onChange={(event) => {
                    setAmount(event.target.value.replace(/[^\d]/g, ''))
                    setAmountError(null)
                }}
                error={amountError}
            />

            <FormField
                label="Xabar"
                placeholder="Streamerga bir necha soʻz (ixtiyoriy)"
                maxLength={DONATION_MESSAGE_MAX}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
            />

            {authenticated ? (
                <label className={styles.checkbox}>
                    <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                    <span>Anonim donat (ismim koʻrsatilmasin)</span>
                </label>
            ) : (
                <Text size="sm" tone="muted">Siz tizimga kirmagansiz, shuning uchun donatingiz anonim boʻladi.</Text>
            )}

            {donate.isError && <Alert>{getErrorMessage(donate.error, 'Toʻlovni boshlab boʻlmadi.')}</Alert>}

            <Button type="submit" size="lg" fullWidth loading={donate.isPending} leftIcon={<Icon name="gift" size={18} />}>
                {amount && !validateAmount(amount) ? `${formatSom(Number(amount))} donat qilish` : 'Donat qilish'}
            </Button>
            <Text size="xs" tone="subtle" className={styles.note}>
                Toʻlov Multicard sahifasida, yangi tabda amalga oshiriladi. Karta maʼlumotlari uztent’ga yuborilmaydi.
            </Text>
        </form>
    )
}

/**
 * "Donat" button that opens the donate form in a modal. Anyone can donate, including guests.
 * @param {{target: string, streamerName: string}} props  target: live stream id or username
 */
export function DonateButton({ target, streamerName }) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button leftIcon={<Icon name="gift" size={18} />} onClick={() => setOpen(true)}>
                Donat
            </Button>
            <Modal open={open} onClose={() => setOpen(false)} title={`Donat: ${streamerName}`}>
                {/* Remount on open so a cancelled attempt starts fresh */}
                {open && <DonateForm target={target} />}
            </Modal>
        </>
    )
}
