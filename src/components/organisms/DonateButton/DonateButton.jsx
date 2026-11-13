import { useState } from 'react'
import { Link } from 'react-router'
import { getErrorMessage, getErrorStatus } from '@/api/errors'
import { Button, Icon, Skeleton, Spinner, Text } from '@/components/atoms'
import { Alert, FormField, Modal } from '@/components/molecules'
import { DONATION_MAX, DONATION_MESSAGE_MAX, DONATION_MIN, useConfirmDonation, useCreateDonation, useDonation } from '@/features/donations'
import { cardLabel, useSavedCards } from '@/features/payments'
import { cn } from '@/lib/cn'
import { formatSom } from '@/lib/format'
import { useIsAuthenticated } from '@/lib/session'
import { paths } from '@/routes/paths'
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

const CHECKOUT = 'checkout'

function Paid({ amount }) {
    return (
        <div className={styles.status}>
            <span className={styles.success}><Icon name="checkCircle" size={40} /></span>
            <Text weight="semibold">Rahmat! {formatSom(amount)} donatingiz yuborildi.</Text>
        </div>
    )
}

function Failed({ expired, onRetry, children }) {
    return (
        <div className={styles.status}>
            <span className={styles.danger}><Icon name="alert" size={40} /></span>
            <Text weight="semibold">{expired ? 'Toʻlov muddati tugadi.' : 'Toʻlov amalga oshmadi.'}</Text>
            {children}
            <Button onClick={onRetry} fullWidth>Qayta urinish</Button>
        </div>
    )
}

/** The SMS code Multicard sent to the card's phone. A wrong code can be retried. */
function OtpForm({ donation, onDeclined }) {
    const [otp, setOtp] = useState('')
    const [error, setError] = useState(null)
    const confirm = useConfirmDonation({
        onMutate: () => setError(null),
        onError: (err) => (getErrorStatus(err) === 402 ? onDeclined(err) : setError(getErrorMessage(err, 'Kodni tasdiqlab boʻlmadi.'))),
    })

    function handleSubmit(event) {
        event.preventDefault()
        if (!/^\d{4,8}$/.test(otp)) {
            setError('SMS koddagi raqamlarni kiriting.')
            return
        }
        confirm.mutate({ id: donation.id, otp })
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <Text weight="semibold">Kartangiz telefoniga SMS kod yuborildi</Text>
            <Text tone="muted">{formatSom(donation.amount)} toʻlovini tasdiqlash uchun kodni kiriting.</Text>
            <FormField
                label="SMS kod"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={otp}
                onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))
                    setError(null)
                }}
                error={error}
                autoFocus
            />
            <Button type="submit" size="lg" fullWidth loading={confirm.isPending}>Tasdiqlash</Button>
        </form>
    )
}

/**
 * A saved-card donation after POST: usually already `paid`; otherwise the SMS code step, or waiting
 * while Multicard settles it (GET /donations/:id asks Multicard).
 */
function CardPaymentStatus({ donation, onRetry }) {
    const { data, polling } = useDonation(donation.id)
    const [declined, setDeclined] = useState(null)
    const current = data ?? donation

    if (declined) {
        return <Failed onRetry={onRetry}><Text tone="muted">{getErrorMessage(declined)}</Text></Failed>
    }
    if (current.status === 'paid') return <Paid amount={current.amount} />
    if (current.status === 'pending' && current.otpRequired) return <OtpForm donation={current} onDeclined={setDeclined} />
    if (current.status === 'pending') {
        return (
            <div className={styles.status}>
                {polling && <Spinner size="lg" />}
                <Text weight="semibold">{polling ? 'Toʻlov tasdiqlanmoqda…' : 'Toʻlov hali tasdiqlanmadi.'}</Text>
                {!polling && <Text tone="muted">Bank javobini kutyapmiz. Birozdan soʻng streamdagi chatni tekshiring.</Text>}
            </div>
        )
    }
    return <Failed expired={current.status === 'expired'} onRetry={onRetry} />
}

/** Saved cards plus "Multicard's page" as payment options (signed-in donors). */
function PaymentMethods({ cards, value, onChange }) {
    if (cards.isPending) return <Skeleton style={{ height: '4.4rem' }} />
    const options = [
        ...(cards.data ?? []).map((card) => ({ value: card.id, label: cardLabel(card), icon: 'wallet' })),
        { value: CHECKOUT, label: 'Multicard sahifasida toʻlash', icon: 'send' },
    ]
    return (
        <div className={styles.methods} role="radiogroup" aria-label="Toʻlov usuli">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={value === option.value}
                    className={cn(styles.method, value === option.value && styles.selected)}
                    onClick={() => onChange(option.value)}
                >
                    <Icon name={option.icon} size={16} />
                    <span>{option.label}</span>
                </button>
            ))}
            <Link to={paths.settingsCards} className={styles.addCard}>+ Karta qoʻshish</Link>
        </div>
    )
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

    if (status === 'paid') return <Paid amount={donation.amount} />
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
    return <Failed expired={status === 'expired'} onRetry={onRetry} />
}

function DonateForm({ target }) {
    const authenticated = useIsAuthenticated()
    const [amount, setAmount] = useState('10000')
    const [message, setMessage] = useState('')
    const [anonymous, setAnonymous] = useState(false)
    const [amountError, setAmountError] = useState(null)
    const [popupBlocked, setPopupBlocked] = useState(false)
    const cards = useSavedCards()
    const [method, setMethod] = useState(null)
    // Until the donor picks, a saved card is the default (one click); guests always use the page
    const selected = !authenticated ? CHECKOUT : method ?? cards.data?.[0]?.id ?? CHECKOUT
    const byCard = selected !== CHECKOUT

    const donate = useCreateDonation()

    function handleSubmit(event) {
        event.preventDefault()
        const error = validateAmount(amount)
        setAmountError(error)
        if (error) return
        const body = {
            target,
            amount: Number(amount),
            message: message.trim() || undefined,
            anonymous: authenticated ? anonymous : undefined, // guests are always anonymous
        }
        if (byCard) {
            donate.mutate({ ...body, cardId: selected })
            return
        }
        // Open the tab now, while we're still inside the click: browsers block window.open after an
        // await. It gets the checkout URL once the invoice exists, or is closed if that fails.
        const checkoutTab = window.open('', '_blank')
        if (checkoutTab) {
            checkoutTab.opener = null
            checkoutTab.document.title = 'Toʻlov…'
        }
        setPopupBlocked(!checkoutTab)
        donate.mutate(body, {
            onSuccess: (donation) => {
                if (checkoutTab && donation.checkoutUrl) checkoutTab.location.href = donation.checkoutUrl
                else checkoutTab?.close()
            },
            onError: () => checkoutTab?.close(),
        })
    }

    if (donate.isSuccess && (donate.data.paymentMethod === 'card' || donate.variables?.cardId)) {
        return <CardPaymentStatus donation={donate.data} onRetry={() => donate.reset()} />
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

            {authenticated && <PaymentMethods cards={cards} value={selected} onChange={setMethod} />}

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
                {byCard
                    ? 'Saqlangan kartadan darhol yechiladi. Bank SMS kod soʻrashi mumkin.'
                    : 'Toʻlov Multicard sahifasida, yangi tabda amalga oshiriladi. Karta maʼlumotlari uztent’ga yuborilmaydi.'}
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
