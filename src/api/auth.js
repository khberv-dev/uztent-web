import { apiClient } from './client'

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} firstName
 * @property {string} lastName        "" when Google has no family name
 * @property {string | null} username null until the user picks one
 * @property {string} email
 * @property {boolean} hasPassword
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} accessToken
 * @property {string} refreshToken  single use; always store the newest one
 * @property {User} user
 */

export const authApi = {
    /** Sign in or sign up with a Google ID token. @returns {Promise<AuthResponse>} */
    async signInWithGoogle(idToken) {
        const { data } = await apiClient.post('/auth/google', { idToken })
        return data
    },

    /** `login` is an email (contains "@") or a username. @returns {Promise<AuthResponse>} */
    async login({ login, password }) {
        const { data } = await apiClient.post('/auth/login', { login, password })
        return data
    },

    /** Ends only this session. Returns 204 even for an already-invalid token. */
    async logout(refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken })
    },

    /**
     * Sets the first password (omit currentPassword) or changes it.
     * Revokes every session and returns a fresh pair for this device.
     * @returns {Promise<AuthResponse>}
     */
    async setPassword({ currentPassword, newPassword }) {
        const body = currentPassword ? { currentPassword, newPassword } : { newPassword }
        const { data } = await apiClient.post('/auth/password', body)
        return data
    },
}

// POST /auth/refresh lives in client.js (refreshAccessToken) because the interceptors drive it.
