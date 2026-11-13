import { formatSom } from '@/lib/format'

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

/*
 * The API's messages are in English. The documented ones are shown in Uzbek; anything else
 * (e.g. raw validation text) is shown as is.
 */
const API_MESSAGES = {
    'Invalid credentials': 'Login yoki parol notoʻgʻri.',
    'Invalid Google token': 'Google tokeni yaroqsiz.',
    'Google account email is not verified': 'Google akkauntingiz emaili tasdiqlanmagan.',
    'Invalid refresh token': 'Sessiya tugadi. Qaytadan kiring.',
    'Current password is incorrect': 'Joriy parol notoʻgʻri.',
    'currentPassword is required': 'Joriy parolni kiriting.',
    'Username is already taken': 'Bu username band.',
    'User not found': 'Foydalanuvchi topilmadi.',
    'User is not live': 'Foydalanuvchi hozir live’da emas.',
    'Stream not found': 'Stream topilmadi.',
    'VOD not found': 'Video topilmadi.',
    'Message not found': 'Xabar topilmadi.',
    'You can only delete your own VODs': 'Faqat oʻz videolaringizni oʻchira olasiz.',
    'You are sending messages too fast': 'Juda tez yozyapsiz. Biroz kuting.',
    'You are banned from this chat': 'Siz bu chatdan ban qilingansiz.',
    'Only the streamer and moderators can do this': 'Buni faqat streamer va moderatorlar qila oladi.',
    "Moderators can't ban other moderators": 'Moderatorlar boshqa moderatorlarni ban qila olmaydi.',
    "The streamer can't be banned": 'Streamerni ban qilib boʻlmaydi.',
    "You can't ban yourself": 'Oʻzingizni ban qila olmaysiz.',
    'You are already the streamer of your channel': 'Siz bu kanalning streamerisiz.',
    "You can't donate to your own stream": 'Oʻz streamingizga donat qila olmaysiz.',
    'Too many donation requests, try again in a minute': 'Juda koʻp soʻrov. Bir daqiqadan soʻng qayta urinib koʻring.',
    'Payment provider is unavailable': 'Toʻlov tizimi hozir ishlamayapti. Keyinroq urinib koʻring.',
    'Payment provider rejected the request': 'Toʻlov tizimi soʻrovni rad etdi. Keyinroq urinib koʻring.',
    'Donation not found': 'Donat topilmadi.',
    'Payment was declined': 'Karta toʻlovni rad etdi.',
    'Sign in to pay with a saved card': 'Saqlangan karta bilan toʻlash uchun tizimga kiring.',
    'Card not found': 'Karta topilmadi.',
    'Wrong confirmation code': 'SMS kod notoʻgʻri. Qayta kiriting.',
    "This donation doesn't need confirmation": 'Bu donat tasdiqlashni talab qilmaydi.',
    'This donation has expired': 'Donat muddati tugadi. Qaytadan urinib koʻring.',
    'You can link at most 10 cards': 'Koʻpi bilan 10 ta karta qoʻshish mumkin.',
    'Card binding not found or expired': 'Karta qoʻshish sessiyasi topilmadi yoki muddati tugadi.',
    'This card is linked to another account': 'Bu karta boshqa akkauntga bogʻlangan.',
    'No stream key yet. Generate one with POST /streams/me/key': 'Hali stream key yoʻq. Avval stream key yarating.',
}

/** Multicard's decline codes that are worth explaining to the donor. */
const DECLINE_REASONS = {
    ERROR_INSUFFICIENT_FUNDS: 'Kartada mablagʻ yetarli emas.',
    ERROR_CARD_EXPIRED: 'Karta muddati tugagan.',
    ERROR_CARD_BLOCKED: 'Karta bloklangan.',
}

function translate(message) {
    if (API_MESSAGES[message]) return API_MESSAGES[message]
    const slow = message.match(/^Slow mode is on: wait (\d+) s/)
    if (slow) return `Slow mode yoqilgan: keyingi xabar uchun ${slow[1]} s kuting.`
    const amount = message.match(/^amount must be between (\d+) and (\d+)/)
    if (/^otp must be/.test(message)) return 'SMS kod 4–8 ta raqamdan iborat boʻlishi kerak.'
    if (/^phone must be/.test(message)) return 'Telefon raqamini 998XXXXXXXXX koʻrinishida kiriting.'
    if (amount) return `Summa ${formatSom(Number(amount[1]))} va ${formatSom(Number(amount[2]))} oraligʻida boʻlishi kerak.`
    return message.charAt(0).toUpperCase() + message.slice(1)
}

/** One human-readable message for an alert. */
export function getErrorMessage(error, fallback = 'Nimadir xato ketdi. Qayta urinib koʻring.') {
    if (error?.code === 'ERR_NETWORK') return 'Serverga ulanib boʻlmadi. Internet aloqasini tekshiring.'
    const messages = messagesOf(error)
    // 5xx: only documented messages (e.g. 502 "Payment provider is unavailable") are worth showing
    if (getErrorStatus(error) >= 500 && !messages.some((m) => API_MESSAGES[m])) return 'Serverda xatolik. Birozdan soʻng qayta urinib koʻring.'
    if (messages.length === 0) return fallback
    const text = messages.map(translate).join(' ')
    // 402 "Payment was declined" carries Multicard's code, e.g. ERROR_INSUFFICIENT_FUNDS
    const reason = DECLINE_REASONS[error?.response?.data?.reason]
    return reason ? `${text} ${reason}` : text
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
            fieldErrors[field] = translate(message)
        } else if (!field) {
            rest.push(message)
        }
    }

    return {
        fieldErrors,
        formError: rest.length ? getErrorMessage({ response: { data: { message: rest } } }) : null,
    }
}
