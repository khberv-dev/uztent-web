/* Client-side checks mirroring the API's rules, so most mistakes never reach the server. */

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/

export function validateProfile({ firstName, lastName, username }) {
    const errors = {}
    if (!firstName.trim()) errors.firstName = 'First name is required.'
    else if (firstName.trim().length > 100) errors.firstName = 'First name must be 100 characters or fewer.'
    if (lastName.trim().length > 100) errors.lastName = 'Last name must be 100 characters or fewer.'
    const normalized = username.trim().toLowerCase()
    if (normalized && !USERNAME_PATTERN.test(normalized)) {
        errors.username = 'Use 3–30 characters: letters, digits, underscores or dots.'
    }
    return errors
}

export function validatePassword({ currentPassword, newPassword, confirmPassword }, { hasPassword }) {
    const errors = {}
    if (hasPassword && !currentPassword) errors.currentPassword = 'Enter your current password.'
    if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters.'
    else if (newPassword.length > 128) errors.newPassword = 'Password must be 128 characters or fewer.'
    if (!errors.newPassword && confirmPassword !== newPassword) errors.confirmPassword = 'Passwords don’t match.'
    return errors
}
