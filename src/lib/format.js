/*
 * Uzbek formatting is done by hand: browsers ship incomplete 'uz' locale data (Chrome formats
 * relative time as "-1 h", dates as "2026 M11 12" and compact numbers as "1.2K"), so Intl can't be
 * trusted to read the same everywhere.
 */

const NBSP = '\u00a0'
const groupDigits = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
const oneDecimal = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',')

/** 950 → "950", 1234 → "1,2 ming", 3400000 → "3,4 mln" */
export function formatCount(count) {
    const n = Math.max(0, Math.round(count ?? 0))
    if (n < 1000) return String(n)
    if (n < 1_000_000) return `${oneDecimal(n / 1000)} ming`
    if (n < 1_000_000_000) return `${oneDecimal(n / 1_000_000)} mln`
    return `${oneDecimal(n / 1_000_000_000)} mlrd`
}

const UNITS = [
    ['yil', 365 * 24 * 3600],
    ['oy', 30 * 24 * 3600],
    ['hafta', 7 * 24 * 3600],
    ['kun', 24 * 3600],
    ['soat', 3600],
    ['daqiqa', 60],
]

/** "3 soat oldin", "2 kun oldin", "hozirgina" */
export function formatTimeAgo(iso, now = Date.now()) {
    const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000)
    for (const [unit, size] of UNITS) {
        if (seconds >= size) return `${Math.floor(seconds / size)} ${unit} oldin`
    }
    return 'hozirgina'
}

/** Elapsed time between two instants as "1:02:05" or "12:05". */
export function formatDuration(fromIso, toIso = new Date().toISOString()) {
    const total = Math.max(0, Math.floor((new Date(toIso) - new Date(fromIso)) / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const mm = h ? String(m).padStart(2, '0') : String(m)
    return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

/** "12-noyabr, 2026" (the year is left out for the current year) */
export function formatDate(iso, now = new Date()) {
    const date = new Date(iso)
    const day = `${date.getDate()}-${MONTHS[date.getMonth()]}`
    return date.getFullYear() === now.getFullYear() ? day : `${day}, ${date.getFullYear()}`
}

/** "09:05" (24-hour, local time) */
export function formatTime(iso) {
    const date = new Date(iso)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** Stable hue (0–359) from an id, for placeholder thumbnails. */
export function hueFromId(id = '') {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
    return Math.abs(hash) % 360
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Path ids must be UUIDs; checking first avoids a pointless 400. */
export function isUuid(value) {
    return typeof value === 'string' && UUID_PATTERN.test(value)
}

/** Seconds as a clock: "1:02:05", "2:05", "0:07". */
export function formatClock(totalSeconds) {
    const total = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = String(total % 60).padStart(2, '0')
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/**
 * 20000 → "20 000 soʻm" (non-breaking space between thousands). Grouped by hand: browsers' 'uz'
 * locale data differs (Chrome groups with commas), and amounts must read the same everywhere.
 */
export function formatSom(amount) {
    return `${amount < 0 ? '−' : ''}${groupDigits(Math.round(Math.abs(amount)))}${NBSP}soʻm`
}
