/** Public follow lists show the username, or the first name when there's none (as the chat does). */
export function followName(user) {
    return user.username ?? (user.firstName || 'Foydalanuvchi')
}
