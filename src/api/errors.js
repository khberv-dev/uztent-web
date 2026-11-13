/*
 * Helpers for the API's NestJS error format:
 *   { message: string | string[], error?: string, statusCode: number }
 * 400 validation errors carry an array of messages that start with the field name,
 * e.g. "newPassword must be longer than or equal to 8 characters".
 */

function messagesOf(error) {
    const message = error?.response?.data?.message
    if (Array.isArray(message)) return message
    if (typeof message === 'string') return [message]
    return []
}

export function getErrorStatus(error) {
    return error?.response?.status ?? null
}

/** One human-readable message for an alert. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.'
    if (getErrorStatus(error) >= 500) return 'Server error. Please try again later.'
    const messages = messagesOf(error)
    if (messages.length === 0) return fallback
    const text = messages.join('. ')
    return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Splits validation messages into per-field errors and the rest.
 * @param {unknown} error
 * @param {string[]} fields form field names, matched against the start of each message
 * @returns {{fieldErrors: Record<string, string>, formError: string | null}}
 */
export function getValidationErrors(error, fields) {
    if (getErrorStatus(error) !== 400) {
        return { fieldErrors: {}, formError: getErrorMessage(error) }
    }

    const fieldErrors = {}
    const rest = []
    for (const message of messagesOf(error)) {
        const field = fields.find((name) => message === name || message.startsWith(`${name} `))
        if (field && !fieldErrors[field]) {
            fieldErrors[field] = message.charAt(0).toUpperCase() + message.slice(1)
        } else if (!field) {
            rest.push(message)
        }
    }

    return {
        fieldErrors,
        formError: rest.length ? getErrorMessage({ response: { data: { message: rest } } }) : null,
    }
}
