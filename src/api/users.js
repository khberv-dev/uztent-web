import { apiClient } from './client'

export const usersApi = {
    /** @returns {Promise<import('./auth').User>} */
    async getMe() {
        const { data } = await apiClient.get('/users/me')
        return data
    },

    /**
     * Send only changed fields. Unknown fields are rejected with 400.
     * @param {{firstName?: string, lastName?: string, username?: string | null}} patch
     * @returns {Promise<import('./auth').User>}
     */
    async updateMe(patch) {
        const { data } = await apiClient.patch('/users/me', patch)
        return data
    },

    /**
     * GET /users/username-availability. The API normalizes (lowercase, trim) before checking.
     * @param {string} username
     * @param {AbortSignal} [signal]
     * @returns {Promise<{username: string, available: boolean}>}
     */
    async checkUsernameAvailability(username, signal) {
        const { data } = await apiClient.get('/users/username-availability', { params: { username }, signal })
        return data
    },
}
