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

const apiUrl = required('VITE_API_URL')

export const env = {
    apiUrl,
    // Real-time events; defaults to <API origin>/ws
    wsUrl: import.meta.env.VITE_WS_URL || defaultWsUrl(apiUrl),
    googleClientId: required('VITE_GOOGLE_CLIENT_ID'),
    googleRedirectUri: required('VITE_GOOGLE_REDIRECT_URI'),
}
