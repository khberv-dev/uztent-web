/** Best display name for a user: username, then full name, then email local part. */
export function displayName(user) {
    if (!user) return ''
    if (user.username) return user.username
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return full || user.email?.split('@')[0] || ''
}
