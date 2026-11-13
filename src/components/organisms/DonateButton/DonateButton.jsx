import { useState } from 'react'
import { getErrorMessage } from '@/api/errors'
import { Button, Icon, Text } from '@/components/atoms'
import { Alert, FormField, Modal } from '@/components/molecules'
import { DONATION_MAX, DONATION_MESSAGE_MAX, DONATION_MIN, useCreateDonation } from '@/features/donations'
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

function DonateForm({ target }) {
    const authenticated = useIsAuthenticated()
    const [amount, setAmount] = useState('10000')
    const [message, setMessage] = useState('')
    const [anonymous, setAnonymous] = useState(false)
    const [amountError, setAmountError] = useState(null)

    const donate = useCreateDonation({
        // Multicard's page takes over from here, then returns the donor to /donations/complete
        onSuccess: (donation) => donation.checkoutUrl && window.location.assign(donation.checkoutUrl),
    })
    const redirecting = donate.isSuccess && Boolean(donate.data?.checkoutUrl)

    function handleSubmit(event) {
        event.preventDefault()
        const error = validateAmount(amount)
        setAmountError(error)
        if (error) return
        donate.mutate({
            target,
            amount: Number(amount),
            message: message.trim() || undefined,
            anonymous: authenticated ? anonymous : undefined, // guests are always anonymous
        })
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
                hint={`${formatSom(DONATION_MIN)} – ${formatSom(DONATION_MAX)}`}
            />

            <FormField
                label="Xabar"
                placeholder="Streamerga bir necha soʻz (ixtiyoriy)"
                maxLength={DONATION_MESSAGE_MAX}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                hint={`${message.length}/${DONATION_MESSAGE_MAX}. Xabar streamda hamma uchun koʻrinadi.`}
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

            <Button type="submit" size="lg" fullWidth loading={donate.isPending || redirecting} leftIcon={<Icon name="gift" size={18} />}>
                {amount && !validateAmount(amount) ? `${formatSom(Number(amount))} donat qilish` : 'Donat qilish'}
            </Button>
            <Text size="xs" tone="subtle" className={styles.note}>
                Toʻlov Multicard sahifasida amalga oshiriladi. Karta maʼlumotlari uztent’ga yuborilmaydi.
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
