import { useState } from 'react'
import { getErrorMessage, getErrorStatus, getValidationErrors } from '@/api/errors'
import { Button, Heading, Icon, Skeleton, Text } from '@/components/atoms'
import { Alert, ConfirmButton, FormField } from '@/components/molecules'
import { cardLabel, MAX_CARDS, useAddCard, useConfirmCardBind, useDeleteCard, useSavedCards } from '@/features/payments'
import { formatDate, formatTime } from '@/lib/format'
import styles from './SavedCards.module.css'

const PAN_DIGITS = 16
const PHONE_DIGITS = 9 // after +998
const CARD_FIELDS = ['pan', 'expiry', 'phone']

/** "8600123412341234" → "8600 1234 1234 1234" */
const groupPan = (digits) => digits.replace(/(\d{4})(?=\d)/g, '$1 ')
/** "0628" → "06/28" */
const slashExpiry = (digits) => (digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
/** "901234567" → "90 123 45 67" */
const groupPhone = (digits) => digits.replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4')

/** Client-side check of MM/YY as printed on the card: a real month, not already past. */
function expiryError(digits) {
    if (digits.length !== 4) return 'Amal qilish muddatini OO/YY koʻrinishida kiriting.'
    const month = Number(digits.slice(0, 2))
    const year = 2000 + Number(digits.slice(2))
    if (month < 1 || month > 12) return 'Oy 01 dan 12 gacha boʻlishi kerak.'
    const now = new Date()
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return 'Karta muddati tugagan.'
    return null
}

/** Step 1: card number, expiry and the card's SMS phone. Nothing here is stored or logged. */
function CardDetailsStep({ initial, error: initialError, onCancel, onSent }) {
    const [pan, setPan] = useState(initial?.pan ?? '')
    const [expiry, setExpiry] = useState(initial?.expiry ?? '')
    const [phone, setPhone] = useState(initial?.phone ?? '')
    const [fieldErrors, setFieldErrors] = useState({})
    const [formError, setFormError] = useState(initialError ?? null)
    const add = useAddCard({
        onMutate: () => setFormError(null),
        onSuccess: (binding) => onSent(binding, { pan, expiry, phone }),
        onError: (error) => {
            if (getErrorStatus(error) === 400) {
                const { fieldErrors: apiFieldErrors } = getValidationErrors(error, CARD_FIELDS)
                if (error.response?.data?.message === 'The card has expired') apiFieldErrors.expiry = 'Karta muddati tugagan.'
                if (Object.keys(apiFieldErrors).length) {
                    setFieldErrors(apiFieldErrors)
                    return
                }
            }
            setFormError(getErrorMessage(error, 'Kartani qoʻshib boʻlmadi.'))
        },
    })

    function clearError(field) {
        setFieldErrors((errors) => ({ ...errors, [field]: null }))
    }

    function handleSubmit(event) {
        event.preventDefault()
        const errors = {
            pan: pan.length === PAN_DIGITS ? null : 'Karta raqamini toʻliq kiriting: 16 ta raqam.',
            expiry: expiryError(expiry),
            phone: phone.length === PHONE_DIGITS ? null : 'Telefon raqamini toʻliq kiriting: 9 ta raqam.',
        }
        setFieldErrors(errors)
        if (Object.values(errors).some(Boolean)) return
        add.mutate({ pan, expiry: slashExpiry(expiry), phone: `998${phone}` })
    }

    return (
        <form className={styles.addForm} onSubmit={handleSubmit} noValidate autoComplete="on">
            <FormField
                label="Karta raqami"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="8600 0000 0000 0000"
                value={groupPan(pan)}
                onChange={(event) => {
                    setPan(event.target.value.replace(/\D/g, '').slice(0, PAN_DIGITS))
                    clearError('pan')
                }}
                error={fieldErrors.pan}
                autoFocus
            />
            <div className={styles.fieldRow}>
                <FormField
                    label="Amal qilish muddati"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="OO/YY"
                    value={slashExpiry(expiry)}
                    onChange={(event) => {
                        setExpiry(event.target.value.replace(/\D/g, '').slice(0, 4))
                        clearError('expiry')
                    }}
                    error={fieldErrors.expiry}
                />
                <FormField
                    leftSlot={<span className={styles.prefix}>+998</span>}
                    label="Kartaga ulangan telefon"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="90 123 45 67"
                    value={phone}
                    onChange={(event) => {
                        setPhone(event.target.value.replace(/\D/g, '').replace(/^998(?=\d{9})/, '').slice(0, PHONE_DIGITS))
                        clearError('phone')
                    }}
                    error={fieldErrors.phone}
                />
            </div>
            <Text size="sm" tone="muted">
                Uzcard va Humo. Multicard shu telefonga SMS kod yuboradi. uztent karta raqamini saqlamaydi, faqat yashirilgan raqamni koʻrsatadi.
            </Text>
            {formError && <Alert>{formError}</Alert>}
            <div className={styles.actions}>
                <Button type="button" variant="ghost" onClick={onCancel} disabled={add.isPending}>Bekor qilish</Button>
                <Button type="submit" loading={add.isPending}>Kod yuborish</Button>
            </div>
        </form>
    )
}

/** Step 2: the SMS code Multicard sent to the card's phone. */
function CodeStep({ binding, card, onBack, onRestart, onResent, onSaved }) {
    const [otp, setOtp] = useState('')
    const [error, setError] = useState(null)
    const confirm = useConfirmCardBind({
        onMutate: () => setError(null),
        onSuccess: onSaved,
        onError: (err) => {
            const status = getErrorStatus(err)
            // The binding is gone: expired / unknown (404), linked elsewhere (409), too many wrong codes (429)
            if ([404, 409, 429].includes(status)) onRestart(getErrorMessage(err))
            else setError(getErrorMessage(err, 'Kodni tasdiqlab boʻlmadi.'))
        },
    })
    // Resending is a new binding (POST /payments/cards again with the same card)
    const resend = useAddCard({
        onMutate: () => setError(null),
        onSuccess: (next) => {
            setOtp('')
            onResent(next)
        },
        onError: (err) => setError(getErrorMessage(err, 'Kodni qayta yuborib boʻlmadi.')),
    })

    function handleSubmit(event) {
        event.preventDefault()
        if (!/^\d{4,8}$/.test(otp)) {
            setError('SMS koddagi raqamlarni kiriting.')
            return
        }
        confirm.mutate({ bindId: binding.bindId, otp })
    }

    const busy = confirm.isPending || resend.isPending

    return (
        <form className={styles.addForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.codeHeader}>
                <Text weight="semibold">{cardLabel(binding)}</Text>
                <Text size="sm" tone="muted">
                    +998 {groupPhone(card.phone)} raqamiga SMS kod yuborildi. Kod {formatTime(binding.expiresAt)} gacha amal qiladi.
                </Text>
            </div>
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
            <div className={styles.actions}>
                <Button type="button" variant="ghost" className={styles.resend} onClick={() => resend.mutate({ ...card, phone: `998${card.phone}`, expiry: slashExpiry(card.expiry) })} loading={resend.isPending} disabled={confirm.isPending}>
                    Kodni qayta yuborish
                </Button>
                <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>Orqaga</Button>
                <Button type="submit" loading={confirm.isPending} disabled={resend.isPending}>Tasdiqlash</Button>
            </div>
        </form>
    )
}

/**
 * Adding a card in two steps. The typed card details stay in this component's state only (so "Back"
 * and "Resend" don't make the user retype them) and are dropped when it unmounts.
 */
function AddCardForm({ onCancel, onSaved }) {
    const [card, setCard] = useState(null)
    const [binding, setBinding] = useState(null)
    const [restartError, setRestartError] = useState(null)

    if (!binding) {
        return (
            <CardDetailsStep
                key={restartError ?? 'details'}
                initial={card}
                error={restartError}
                onCancel={onCancel}
                onSent={(next, details) => {
                    setCard(details)
                    setBinding(next)
                    setRestartError(null)
                }}
            />
        )
    }
    return (
        <CodeStep
            binding={binding}
            card={card}
            onBack={() => setBinding(null)}
            onRestart={(message) => {
                setBinding(null)
                setRestartError(message)
            }}
            onResent={setBinding}
            onSaved={onSaved}
        />
    )
}

/**
 * The user's saved cards (for one-click donations): list, remove, add (number, expiry, phone, then SMS code).
 * @param {{startAdding?: boolean}} props startAdding: open the add form right away (the /settings/cards link)
 */
export function SavedCards({ startAdding = false }) {
    const cards = useSavedCards()
    const [adding, setAdding] = useState(startAdding)
    const [saved, setSaved] = useState(null)
    const [deleteError, setDeleteError] = useState(null)
    const remove = useDeleteCard({
        onMutate: () => setDeleteError(null),
        onError: (error) => setDeleteError(getErrorMessage(error, 'Kartani oʻchirib boʻlmadi.')),
    })
    const full = (cards.data?.length ?? 0) >= MAX_CARDS

    return (
        <section className={styles.section} aria-labelledby="saved-cards-title">
            <div className={styles.header}>
                <div>
                    <Heading level={3} id="saved-cards-title">Kartalar</Heading>
                    <Text tone="muted">Saqlangan karta bilan donat Multicard sahifasini ochmasdan yuboriladi.</Text>
                </div>
                {!adding && cards.isSuccess && (
                    <Button variant="secondary" leftIcon={<Icon name="wallet" size={18} />} onClick={() => {
                        setSaved(null)
                        setAdding(true)
                    }} disabled={full} title={full ? `Koʻpi bilan ${MAX_CARDS} ta karta` : undefined}>
                        Karta qoʻshish
                    </Button>
                )}
            </div>

            {saved && (
                <Alert variant="success">
                    {cardLabel(saved)} saqlandi. Endi donatlarni bir bosishda yuborishingiz mumkin.{' '}
                    <Button variant="ghost" size="sm" onClick={() => setSaved(null)}>Yopish</Button>
                </Alert>
            )}
            {adding && (
                <AddCardForm
                    onCancel={() => setAdding(false)}
                    onSaved={(card) => {
                        setAdding(false)
                        setSaved(card)
                    }}
                />
            )}
            {deleteError && <Alert>{deleteError}</Alert>}

            {cards.isPending && [0, 1].map((i) => <Skeleton key={i} style={{ height: '4.8rem' }} />)}
            {cards.isError && (
                <Alert>
                    {getErrorMessage(cards.error, 'Kartalarni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => cards.refetch()}>Qayta urinish</Button>
                </Alert>
            )}
            {cards.isSuccess && cards.data.length === 0 && !adding && <Text size="sm" tone="muted">Hali saqlangan karta yoʻq.</Text>}

            {cards.data?.length > 0 && (
                <ul className={styles.list}>
                    {cards.data.map((card) => (
                        <li key={card.id} className={styles.row}>
                            <span className={styles.cardIcon}><Icon name="wallet" size={18} /></span>
                            <div className={styles.cardText}>
                                <Text weight="semibold">{cardLabel(card)}</Text>
                                <Text size="xs" tone="subtle">{formatDate(card.createdAt)} qoʻshilgan</Text>
                            </div>
                            <ConfirmButton
                                size="sm"
                                variant="ghost"
                                confirmLabel="Oʻchirish"
                                loading={remove.isPending && remove.variables === card.id}
                                onConfirm={() => remove.mutate(card.id)}
                            >
                                Oʻchirish
                            </ConfirmButton>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
