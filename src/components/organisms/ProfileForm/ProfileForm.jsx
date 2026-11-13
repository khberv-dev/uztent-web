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
                setErrors({ username: 'That username is already taken. Try another one.' })
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
    if (!usernameError && availability.status === 'taken') usernameError = `@${availability.username} is already taken.`
    if (!usernameError && availability.status === 'invalid' && /[^a-z0-9_.]/.test(availability.username)) {
        usernameError = 'Only letters, digits, underscores and dots are allowed.'
    }
    const usernameSuccess = availability.status === 'available' ? `@${availability.username} is available.` : undefined
    const usernameStatusIcon =
        availability.status === 'checking' ? <Spinner size="sm" label="Checking availability" />
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
                <Heading level={3}>Profile</Heading>
                <Text tone="muted">Change how you appear on uztent.</Text>
            </div>

            {formError && <Alert>{formError}</Alert>}
            {saved && <Alert variant="success">Profile saved.</Alert>}

            <div className={styles.row}>
                <FormField
                    label="First name"
                    required
                    autoComplete="given-name"
                    maxLength={100}
                    value={values.firstName}
                    onChange={update('firstName')}
                    error={errors.firstName}
                />
                <FormField
                    label="Last name"
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
                hint="3–30 characters: letters, digits, underscores or dots. You can log in with it once you set a password."
            />

            <FormField label="Email" value={user.email} disabled hint="Your email comes from Google and can’t be changed." />

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
                    Cancel
                </Button>
                <Button type="submit" loading={isPending} disabled={!dirty || usernameBlocked}>
                    Save changes
                </Button>
            </div>
        </form>
    )
}
