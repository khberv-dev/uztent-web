import { queryClient } from './queryClient'
import { queryKeys } from './queryKeys'
import { clearSession, isAuthenticated, setTokens, subscribe } from './session'

/**
 * Applies any auth response ({accessToken, refreshToken, user}): stores both tokens
 * and seeds the current-user cache so the UI updates without refetching /users/me.
 */
export function applyAuthResponse(data) {
    setTokens(data)
    queryClient.setQueryData(queryKeys.me, data.user)
}

export { clearSession }

// Whenever the session ends (logout, failed refresh, another tab signing out),
// drop every cached query so nothing from the previous user leaks into the next one.
let wasAuthenticated = isAuthenticated()
subscribe(() => {
    const now = isAuthenticated()
    if (wasAuthenticated && !now) queryClient.clear()
    wasAuthenticated = now
})
