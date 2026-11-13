import { useState } from 'react'
import { getErrorStatus, getValidationErrors } from '@/api/errors'
import { Button, Heading, Text } from '@/components/atoms'
import { Alert, PasswordField } from '@/components/molecules'
import { useSetPassword } from '@/features/auth'
import { validatePassword } from '@/features/users'
import styles from './PasswordForm.module.css'

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' }
const FIELDS = ['currentPassword', 'newPassword']

/**
 * Set the first password or change it (POST /auth/password).
 * The API signs out every other session; this device gets a fresh token pair.
 */
export function PasswordForm({ user }) {
    const hasPassword = user.hasPassword
    const [values, setValues] = useState(EMPTY)
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState(null)
    const [success, setSuccess] = useState(null)

    const { mutate, isPending } = useSetPassword({
        onSuccess: () => {
            setValues(EMPTY)
            setSuccess(
                hasPassword
                    ? 'Parol oʻzgartirildi. Boshqa qurilmalardan chiqib ketdingiz.'
                    : 'Parol oʻrnatildi. Endi email yoki username bilan kira olasiz.',
            )
        },
        onError: (error) => {
            if (getErrorStatus(error) === 401) {
                setErrors({ currentPassword: 'Joriy parol notoʻgʻri.' })
                return
            }
            const result = getValidationErrors(error, FIELDS)
            setErrors(result.fieldErrors)
            setFormError(result.formError)
        },
    })

    function update(field) {
        return (event) => {
            setValues((prev) => ({ ...prev, [field]: event.target.value }))
            setErrors((prev) => ({ ...prev, [field]: undefined }))
            setSuccess(null)
        }
    }

    function handleSubmit(event) {
        event.preventDefault()
        const nextErrors = validatePassword(values, { hasPassword })
        setErrors(nextErrors)
        setFormError(null)
        if (Object.keys(nextErrors).length) return

        mutate({
            currentPassword: hasPassword ? values.currentPassword : undefined,
            newPassword: values.newPassword,
        })
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.header}>
                <Heading level={3}>{hasPassword ? 'Parolni oʻzgartirish' : 'Parol oʻrnatish'}</Heading>
                <Text tone="muted">
                    {hasPassword
                        ? 'Parolni oʻzgartirsangiz, boshqa barcha qurilmalardan chiqib ketasiz.'
                        : 'Ixtiyoriy. Parol bilan Google’siz, email yoki username orqali ham kira olasiz.'}
                </Text>
            </div>

            {formError && <Alert>{formError}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Lets password managers associate the new password with the account */}
            <input type="text" name="username" autoComplete="username" value={user.username ?? user.email} readOnly hidden />

            {hasPassword && (
                <PasswordField
                    label="Joriy parol"
                    required
                    autoComplete="current-password"
                    maxLength={128}
                    value={values.currentPassword}
                    onChange={update('currentPassword')}
                    error={errors.currentPassword}
                />
            )}
            <PasswordField
                label="Yangi parol"
                required
                autoComplete="new-password"
                maxLength={128}
                value={values.newPassword}
                onChange={update('newPassword')}
                error={errors.newPassword}
                hint="Kamida 8 ta belgi."
            />
            <PasswordField
                label="Yangi parolni takrorlang"
                required
                autoComplete="new-password"
                maxLength={128}
                value={values.confirmPassword}
                onChange={update('confirmPassword')}
                error={errors.confirmPassword}
            />

            <div className={styles.actions}>
                <Button type="submit" loading={isPending}>
                    {hasPassword ? 'Parolni oʻzgartirish' : 'Parol oʻrnatish'}
                </Button>
            </div>
        </form>
    )
}
