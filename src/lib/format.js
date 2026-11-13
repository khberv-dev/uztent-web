const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export function formatCount(count) {
    return compact.format(count)
}

const UNITS = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['week', 7 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
]

/** "3 hours ago", "yesterday", "just now" */
export function formatTimeAgo(iso, now = Date.now()) {
    const seconds = (new Date(iso).getTime() - now) / 1000
    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
    }
    return 'just now'
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

export function formatDate(iso) {
    return dateFormat.format(new Date(iso))
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
