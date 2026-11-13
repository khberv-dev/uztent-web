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
                    ? 'Password changed. You’ve been signed out on your other devices.'
                    : 'Password set. You can now log in with your email or username.',
            )
        },
        onError: (error) => {
            if (getErrorStatus(error) === 401) {
                setErrors({ currentPassword: 'Current password is incorrect.' })
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
                <Heading level={3}>{hasPassword ? 'Change password' : 'Set a password'}</Heading>
                <Text tone="muted">
                    {hasPassword
                        ? 'Changing your password signs you out on every other device.'
                        : 'Optional. With a password you can also log in with your email or username, without Google.'}
                </Text>
            </div>

            {formError && <Alert>{formError}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Lets password managers associate the new password with the account */}
            <input type="text" name="username" autoComplete="username" value={user.username ?? user.email} readOnly hidden />

            {hasPassword && (
                <PasswordField
                    label="Current password"
                    required
                    autoComplete="current-password"
                    maxLength={128}
                    value={values.currentPassword}
                    onChange={update('currentPassword')}
                    error={errors.currentPassword}
                />
            )}
            <PasswordField
                label="New password"
                required
                autoComplete="new-password"
                maxLength={128}
                value={values.newPassword}
                onChange={update('newPassword')}
                error={errors.newPassword}
                hint="At least 8 characters."
            />
            <PasswordField
                label="Confirm new password"
                required
                autoComplete="new-password"
                maxLength={128}
                value={values.confirmPassword}
                onChange={update('confirmPassword')}
                error={errors.confirmPassword}
            />

            <div className={styles.actions}>
                <Button type="submit" loading={isPending}>
                    {hasPassword ? 'Change password' : 'Set password'}
                </Button>
            </div>
        </form>
    )
}
