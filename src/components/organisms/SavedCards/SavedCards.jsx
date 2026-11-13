import { useState } from 'react'
import { getErrorMessage, getErrorStatus, getValidationErrors } from '@/api/errors'
import { Button, Heading, Icon, Skeleton, Spinner, Text } from '@/components/atoms'
import { Alert, ConfirmButton, FormField } from '@/components/molecules'
import { cardLabel, MAX_CARDS, useCardBind, useDeleteCard, useSavedCards, useStartCardBind } from '@/features/payments'
import { formatDate } from '@/lib/format'
import styles from './SavedCards.module.css'

const PHONE_DIGITS = 9 // after +998

/** Result of returning from Multicard's card form (?bindId=…&result=success|declined). */
function BindResult({ bindId, result, onDismiss }) {
    const declined = result === 'declined'
    // Even on "declined" the binding is checked once: the redirect isn't proof either way
    const { data, error, isError, polling } = useCardBind(bindId)

    if (data?.status === 'active') {
        return (
            <Alert variant="success">
                {data.card ? `${cardLabel(data.card)} saqlandi.` : 'Karta saqlandi.'} Endi donatlarni bir bosishda yuborishingiz mumkin.{' '}
                <Button variant="ghost" size="sm" onClick={onDismiss}>Yopish</Button>
            </Alert>
        )
    }
    if (isError) {
        return (
            <Alert>
                {getErrorStatus(error) === 409 || getErrorStatus(error) === 404
                    ? getErrorMessage(error)
                    : getErrorMessage(error, 'Karta holatini tekshirib boʻlmadi.')}{' '}
                <Button variant="ghost" size="sm" onClick={onDismiss}>Yopish</Button>
            </Alert>
        )
    }
    if (declined && data && data.status !== 'active') {
        return (
            <Alert>
                Karta qoʻshilmadi: Multicard kartani rad etdi yoki forma yopildi.{' '}
                <Button variant="ghost" size="sm" onClick={onDismiss}>Yopish</Button>
            </Alert>
        )
    }
    if (polling || !data) {
        return (
            <div className={styles.checking} role="status">
                <Spinner size="sm" /> <Text size="sm">Karta tekshirilmoqda…</Text>
            </div>
        )
    }
    return (
        <Alert variant="info">
            Karta hali tasdiqlanmadi. Formani oxirigacha toʻldirgan boʻlsangiz, sahifani birozdan soʻng yangilang.{' '}
            <Button variant="ghost" size="sm" onClick={onDismiss}>Yopish</Button>
        </Alert>
    )
}

/** Phone number, then Multicard's card form (same tab; Multicard brings the user back here). */
function AddCardForm({ onCancel }) {
    const [phone, setPhone] = useState('')
    const [phoneError, setPhoneError] = useState(null)
    const start = useStartCardBind({
        onSuccess: ({ formUrl }) => window.location.assign(formUrl),
        onError: (error) => setPhoneError(getValidationErrors(error, ['phone']).fieldErrors.phone ?? null),
    })
    const formError = start.isError && !phoneError ? getErrorMessage(start.error, 'Karta qoʻshishni boshlab boʻlmadi.') : null

    function handleSubmit(event) {
        event.preventDefault()
        if (phone.length !== PHONE_DIGITS) {
            setPhoneError('Telefon raqamini toʻliq kiriting: 9 ta raqam.')
            return
        }
        setPhoneError(null)
        start.mutate(`998${phone}`)
    }

    return (
        <form className={styles.addForm} onSubmit={handleSubmit} noValidate>
            <FormField
                leftSlot={<span className={styles.prefix}>+998</span>}
                label="Kartaga ulangan telefon raqami"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="90 123 45 67"
                value={phone}
                onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, '').replace(/^998(?=\d{9})/, '').slice(0, PHONE_DIGITS))
                    setPhoneError(null)
                }}
                error={phoneError}
                autoFocus
            />
            <Text size="sm" tone="muted">
                Karta raqamini Multicard sahifasida kiritasiz. uztent faqat kartaning yashirilgan raqamini saqlaydi.
            </Text>
            {formError && <Alert>{formError}</Alert>}
            <div className={styles.actions}>
                <Button type="button" variant="ghost" onClick={onCancel} disabled={start.isPending || start.isSuccess}>Bekor qilish</Button>
                <Button type="submit" loading={start.isPending || start.isSuccess}>Davom etish</Button>
            </div>
        </form>
    )
}

/**
 * The user's saved cards (for one-click donations): list, remove, add through Multicard's form.
 * @param {{bindId?: string | null, bindResult?: string | null, onBindDismiss?: () => void}} props
 *   bindId / bindResult: from the return URL after the card form
 */
export function SavedCards({ bindId, bindResult, onBindDismiss }) {
    const cards = useSavedCards()
    const [adding, setAdding] = useState(false)
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
                    <Button variant="secondary" leftIcon={<Icon name="wallet" size={18} />} onClick={() => setAdding(true)} disabled={full} title={full ? `Koʻpi bilan ${MAX_CARDS} ta karta` : undefined}>
                        Karta qoʻshish
                    </Button>
                )}
            </div>

            {bindId && <BindResult bindId={bindId} result={bindResult} onDismiss={onBindDismiss} />}
            {adding && <AddCardForm onCancel={() => setAdding(false)} />}
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
