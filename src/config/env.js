function required(name) {
    const value = import.meta.env[name]
    if (!value) {
        throw new Error(`Missing required env variable ${name}. Copy .env.example to .env and fill it in.`)
    }
    return value
}

/** ws://host:port/ws next to the API (the WebSocket isn't under the /v1 prefix). */
function defaultWsUrl(apiUrl) {
    const url = new URL(apiUrl)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/ws'
    url.search = ''
    return url.toString()
}

/** Optional boolean flag: "true", "1" or "yes" (any case) turn it on; anything else, or unset, is off. */
function flag(name) {
    return ['true', '1', 'yes'].includes(String(import.meta.env[name] ?? '').trim().toLowerCase())
}

const apiUrl = required('VITE_API_URL')

export const env = {
    apiUrl,
    // The API's own origin, for things outside the /v1 prefix (e.g. /public/privacy_policy)
    apiOrigin: new URL(apiUrl).origin,
    // Real-time events; defaults to <API origin>/ws
    wsUrl: import.meta.env.VITE_WS_URL || defaultWsUrl(apiUrl),
    googleClientId: required('VITE_GOOGLE_CLIENT_ID'),
    googleRedirectUri: required('VITE_GOOGLE_REDIRECT_URI'),
    // "Beta" label next to the logo in the navbar
    showBetaBadge: flag('VITE_SHOW_BETA_BADGE'),
}
