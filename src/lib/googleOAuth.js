import { env } from '@/config/env'

/*
 * Google OAuth 2.0 implicit flow returning an ID token.
 * Google requires a `nonce` for response_type=id_token; `state` protects against CSRF.
 * Both are kept in sessionStorage between the redirect out and the redirect back.
 */

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const STATE_KEY = 'uztent.oauth.google.state'
const RETURN_KEY = 'uztent.oauth.google.returnTo'

function randomString(bytes = 16) {
    const buffer = new Uint8Array(bytes)
    crypto.getRandomValues(buffer)
    return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function buildGoogleAuthUrl() {
    const state = randomString()
    const nonce = randomString()
    sessionStorage.setItem(STATE_KEY, state)

    const params = new URLSearchParams({
        client_id: env.googleClientId,
        redirect_uri: env.googleRedirectUri,
        response_type: 'id_token',
        scope: 'openid email profile',
        prompt: 'select_account',
        state,
        nonce,
    })

    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}

/** @param {string} [returnTo] app path to open after sign-in (only same-site paths are kept) */
export function redirectToGoogle(returnTo) {
    if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        sessionStorage.setItem(RETURN_KEY, returnTo)
    } else {
        sessionStorage.removeItem(RETURN_KEY)
    }
    window.location.assign(buildGoogleAuthUrl())
}

/** The path saved by redirectToGoogle, read once. */
export function takeGoogleReturnTo() {
    const value = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
    return value
}

/**
 * Parses the URL fragment Google redirects back with, e.g.
 * `#iss=...&id_token=eyJ...&state=...&authuser=0&prompt=consent`.
 *
 * @param {string} hash window.location.hash
 * @returns {{idToken: string} | {error: string}}
 */
export function parseGoogleCallback(hash) {
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)

    const expectedState = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)

    const error = params.get('error')
    if (error) {
        return { error: error === 'access_denied' ? 'Sign-in was cancelled.' : `Google returned an error: ${error}` }
    }

    const idToken = params.get('id_token')
    if (!idToken) {
        return { error: 'No ID token found in the Google response.' }
    }

    const state = params.get('state')
    if (!expectedState || state !== expectedState) {
        return { error: 'Sign-in session expired or is invalid. Please try again.' }
    }

    return { idToken }
}
