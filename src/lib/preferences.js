/*
 * Per-viewer UI preferences in localStorage. Conveniences only: every read has a fallback,
 * and storage failures (private mode, blocked site data) are ignored.
 */

const PREFIX = 'uztent.pref.'

export function readPreference(name, fallback) {
    try {
        return localStorage.getItem(PREFIX + name) ?? fallback
    } catch {
        return fallback
    }
}

export function writePreference(name, value) {
    try {
        localStorage.setItem(PREFIX + name, value)
    } catch {
        // ignore
    }
}
