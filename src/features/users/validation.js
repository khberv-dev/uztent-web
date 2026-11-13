/* Client-side checks mirroring the API's rules, so most mistakes never reach the server. */

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/

export function validateProfile({ firstName, lastName, username }) {
    const errors = {}
    if (!firstName.trim()) errors.firstName = 'Ismni kiriting.'
    else if (firstName.trim().length > 100) errors.firstName = 'Ism 100 ta belgidan oshmasligi kerak.'
    if (lastName.trim().length > 100) errors.lastName = 'Familiya 100 ta belgidan oshmasligi kerak.'
    const normalized = username.trim().toLowerCase()
    if (normalized && !USERNAME_PATTERN.test(normalized)) {
        errors.username = '3–30 ta belgi: harflar, raqamlar, pastki chiziq yoki nuqta.'
    }
    return errors
}

export function validatePassword({ currentPassword, newPassword, confirmPassword }, { hasPassword }) {
    const errors = {}
    if (hasPassword && !currentPassword) errors.currentPassword = 'Joriy parolni kiriting.'
    if (newPassword.length < 8) errors.newPassword = 'Parol kamida 8 ta belgidan iborat boʻlishi kerak.'
    else if (newPassword.length > 128) errors.newPassword = 'Parol 128 ta belgidan oshmasligi kerak.'
    if (!errors.newPassword && confirmPassword !== newPassword) errors.confirmPassword = 'Parollar mos kelmadi.'
    return errors
}
