import { useSyncExternalStore } from 'react'

/*
 * Token store, following the API's client guide:
 * - access token: memory only (lost on reload; re-obtained via /auth/refresh on the first API call)
 * - refresh token: localStorage, so the session survives reloads and is shared between tabs
 *
 * "Signed in" means "has a refresh token". The user profile lives in the TanStack Query cache
 * (see features/users), not here.
 */

const REFRESH_KEY = 'uztent.refreshToken'
const LEGACY_SESSION_KEY = 'uztent.session'

function readStoredRefreshToken() {
    try {
        return localStorage.getItem(REFRESH_KEY)
    } catch {
        return null
    }
}

function writeStoredRefreshToken(token) {
    try {
        if (token) localStorage.setItem(REFRESH_KEY, token)
        else localStorage.removeItem(REFRESH_KEY)
    } catch {
        // storage unavailable (private mode): the session lasts until reload
    }
}

// One-time migration from the earlier {accessToken, refreshToken, user} blob
function migrateLegacySession() {
    try {
        const raw = localStorage.getItem(LEGACY_SESSION_KEY)
        if (!raw) return
        localStorage.removeItem(LEGACY_SESSION_KEY)
        const legacy = JSON.parse(raw)
        if (legacy?.refreshToken && !readStoredRefreshToken()) writeStoredRefreshToken(legacy.refreshToken)
    } catch {
        // ignore
    }
}

migrateLegacySession()

let accessToken = null
let refreshToken = readStoredRefreshToken()
const listeners = new Set()

function emit() {
    listeners.forEach((listener) => listener())
}

export function getAccessToken() {
    return accessToken
}

/**
 * Reads from storage every time, so a token rotated by another tab is picked up
 * even before the `storage` event arrives.
 */
export function getRefreshToken() {
    return readStoredRefreshToken() ?? refreshToken
}

/** Store a new token pair. Call after every 200 from /auth/google, /auth/login, /auth/refresh, /auth/password. */
export function setTokens(tokens) {
    accessToken = tokens.accessToken
    refreshToken = tokens.refreshToken
    writeStoredRefreshToken(tokens.refreshToken)
    emit()
}

export function clearSession() {
    const wasSignedIn = Boolean(refreshToken || accessToken)
    accessToken = null
    refreshToken = null
    writeStoredRefreshToken(null)
    if (wasSignedIn) emit()
}

export function isAuthenticated() {
    return Boolean(refreshToken)
}

export function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

// Other tabs: sign-out propagates; a rotated refresh token is adopted.
// The in-memory access token stays valid until it expires, then this tab refreshes on its own.
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key !== REFRESH_KEY) return
        refreshToken = event.newValue
        if (!refreshToken) accessToken = null
        emit()
    })
}

export function useIsAuthenticated() {
    return useSyncExternalStore(subscribe, isAuthenticated)
}
