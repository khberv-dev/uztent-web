import axios from 'axios'
import { env } from '@/config/env'
import { applyAuthResponse } from '@/lib/authSession'
import { clearSession, getAccessToken, getRefreshToken } from '@/lib/session'

export const apiClient = axios.create({
    baseURL: env.apiUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
})

// Endpoints that never take a Bearer token and must not trigger a refresh
const PUBLIC_PATHS = new Set(['/auth/google', '/auth/login', '/auth/refresh', '/auth/logout'])
const isPublic = (config) => PUBLIC_PATHS.has(config?.url)

// Where "404 User not found" means the *caller's* account is gone. Elsewhere it's about someone
// else (e.g. GET /streams/:username for an unknown username) and must not sign anyone out.
const ACCOUNT_PATHS = new Set(['/users/me', '/auth/password'])

/* ---------------------------------- refresh ---------------------------------- */

let refreshPromise = null

/**
 * Exchanges the refresh token for a new pair. Refresh tokens are single use, so:
 * - within a tab, concurrent callers share one in-flight request;
 * - across tabs, a Web Lock serializes refreshes, and the token is re-read from storage
 *   inside the lock so a tab never reuses a token another tab already rotated.
 * On 401 (session expired/revoked/already used) the local session is cleared.
 * @returns {Promise<string>} the new access token
 */
export function refreshAccessToken() {
    if (!refreshPromise) {
        const run = async () => {
            const refreshToken = getRefreshToken()
            if (!refreshToken) {
                clearSession()
                throw new Error('No refresh token')
            }
            try {
                const { data } = await apiClient.post('/auth/refresh', { refreshToken })
                applyAuthResponse(data)
                return data.accessToken
            } catch (error) {
                const status = error.response?.status
                // Session revoked/expired: sign out, unless another tab rotated the token meanwhile
                // (then the newer token is still valid). Network errors keep the session.
                if ((status === 401 || status === 400) && getRefreshToken() === refreshToken) clearSession()
                throw error
            }
        }

        const locked = typeof navigator !== 'undefined' && navigator.locks
            ? navigator.locks.request('uztent.auth.refresh', run)
            : run()

        refreshPromise = locked.finally(() => {
            refreshPromise = null
        })
    }
    return refreshPromise
}

/* -------------------------------- interceptors -------------------------------- */

apiClient.interceptors.request.use(async (config) => {
    if (isPublic(config)) return config

    let token = getAccessToken()
    // After a reload only the refresh token survives; get an access token before the first call
    if (!token && getRefreshToken()) token = await refreshAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error
        const status = response?.status
        // Only a bare "Unauthorized" means a bad/expired access token. Other 401s on protected
        // endpoints (e.g. "Current password is incorrect") are normal errors for the caller.
        const tokenRejected = status === 401 && response?.data?.message === 'Unauthorized'

        if (tokenRejected && config && !isPublic(config) && !config._retried && getRefreshToken()) {
            config._retried = true
            // If another request already refreshed while this one was in flight, reuse its token
            const sentWith = config.headers?.Authorization?.replace(/^Bearer /, '')
            const current = getAccessToken()
            const token = current && current !== sentWith ? current : await refreshAccessToken()
            config.headers.Authorization = `Bearer ${token}`
            return apiClient(config)
        }

        // Still unauthorized after a refresh, or the caller's own account was deleted
        const accountGone = status === 404 && response?.data?.message === 'User not found' && ACCOUNT_PATHS.has(config?.url)
        if (!isPublic(config) && (tokenRejected || accountGone)) {
            clearSession()
        }

        return Promise.reject(error)
    },
)
