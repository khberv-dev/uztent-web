import { useState } from 'react'
import { getErrorStatus, getValidationErrors } from '@/api/errors'
import { Button, Heading, Icon, Spinner, Text } from '@/components/atoms'
import { Alert, FormField } from '@/components/molecules'
import { useUpdateMe, useUsernameAvailability, validateProfile } from '@/features/users'
import styles from './ProfileForm.module.css'

const FIELDS = ['firstName', 'lastName', 'username']

function toValues(user) {
    return { firstName: user.firstName ?? '', lastName: user.lastName ?? '', username: user.username ?? '' }
}

/** Builds the PATCH body with only changed fields. Empty username means "remove it" (null). */
function diff(values, user) {
    const patch = {}
    const firstName = values.firstName.trim()
    const lastName = values.lastName.trim()
    const username = values.username.trim().toLowerCase() || null
    if (firstName !== user.firstName) patch.firstName = firstName
    if (lastName !== (user.lastName ?? '')) patch.lastName = lastName
    if (username !== user.username) patch.username = username
    return patch
}

/** Edit first name, last name and username (PATCH /users/me). */
export function ProfileForm({ user }) {
    const [values, setValues] = useState(() => toValues(user))
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState(null)
    const [saved, setSaved] = useState(false)

    const { mutate, isPending } = useUpdateMe({
        onSuccess: (updated) => {
            setValues(toValues(updated))
            setSaved(true)
        },
        onError: (error) => {
            if (getErrorStatus(error) === 409) {
                setErrors({ username: 'Bu username band. Boshqasini tanlang.' })
                return
            }
            const result = getValidationErrors(error, FIELDS)
            setErrors(result.fieldErrors)
            setFormError(result.formError)
        },
    })

    const availability = useUsernameAvailability(values.username, user.username)
    const usernameBlocked = availability.status === 'checking' || availability.status === 'taken'

    const patch = diff(values, user)
    const dirty = Object.keys(patch).length > 0

    // Submit-time/server errors win; otherwise show the live result
    let usernameError = errors.username
    if (!usernameError && availability.status === 'taken') usernameError = `@${availability.username} band.`
    if (!usernameError && availability.status === 'invalid' && /[^a-z0-9_.]/.test(availability.username)) {
        usernameError = 'Faqat harflar, raqamlar, pastki chiziq va nuqta mumkin.'
    }
    const usernameSuccess = availability.status === 'available' ? `@${availability.username} boʻsh.` : undefined
    const usernameStatusIcon =
        availability.status === 'checking' ? <Spinner size="sm" label="Tekshirilmoqda" />
        : availability.status === 'available' ? <Icon name="check" size={18} className={styles.available} />
        : null

    function update(field) {
        return (event) => {
            setValues((prev) => ({ ...prev, [field]: event.target.value }))
            setErrors((prev) => ({ ...prev, [field]: undefined }))
            setSaved(false)
        }
    }

    function handleSubmit(event) {
        event.preventDefault()
        const nextErrors = validateProfile(values)
        setErrors(nextErrors)
        setFormError(null)
        if (Object.keys(nextErrors).length || !dirty || usernameBlocked) return
        mutate(patch)
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.header}>
                <Heading level={3}>Profil</Heading>
                <Text tone="muted">uztent’da qanday koʻrinishingizni oʻzgartiring.</Text>
            </div>

            {formError && <Alert>{formError}</Alert>}
            {saved && <Alert variant="success">Profil saqlandi.</Alert>}

            <div className={styles.row}>
                <FormField
                    label="Ism"
                    required
                    autoComplete="given-name"
                    maxLength={100}
                    value={values.firstName}
                    onChange={update('firstName')}
                    error={errors.firstName}
                />
                <FormField
                    label="Familiya"
                    autoComplete="family-name"
                    maxLength={100}
                    value={values.lastName}
                    onChange={update('lastName')}
                    error={errors.lastName}
                />
            </div>

            <FormField
                label="Username"
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
                maxLength={30}
                placeholder="pick_a_username"
                leftSlot="@"
                rightSlot={usernameStatusIcon}
                value={values.username}
                onChange={update('username')}
                error={usernameError}
                success={usernameSuccess}
                hint="3–30 ta belgi: harflar, raqamlar, pastki chiziq yoki nuqta. Parol oʻrnatgach, u bilan ham kira olasiz."
            />

            <FormField label="Email" value={user.email} disabled hint="Email Google’dan olinadi va uni oʻzgartirib boʻlmaydi." />

            <div className={styles.actions}>
                <Button
                    variant="ghost"
                    disabled={!dirty || isPending}
                    onClick={() => {
                        setValues(toValues(user))
                        setErrors({})
                        setFormError(null)
                    }}
                >
                    Bekor qilish
                </Button>
                <Button type="submit" loading={isPending} disabled={!dirty || usernameBlocked}>
                    Saqlash
                </Button>
            </div>
        </form>
    )
}
