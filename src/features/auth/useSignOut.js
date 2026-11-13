import { useCallback } from 'react'
import { authApi } from '@/api/auth'
import { clearSession, getRefreshToken } from '@/lib/session'

/**
 * Signs out this device: clears tokens immediately (the UI redirects at once),
 * then revokes the session server-side. Logout is idempotent, so a failed call is ignored.
 */
export function useSignOut() {
    return useCallback(() => {
        const refreshToken = getRefreshToken()
        clearSession()
        if (refreshToken) authApi.logout(refreshToken).catch(() => {})
    }, [])
}
