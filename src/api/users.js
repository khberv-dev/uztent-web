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

    /* ------------------------------------ follows ------------------------------------ */

    /** POST /users/:userId/follow (idempotent). @returns {Promise<FollowStatus>} */
    async follow(userId) {
        const { data } = await apiClient.post(`/users/${userId}/follow`)
        return data
    },

    /** DELETE /users/:userId/follow (idempotent). @returns {Promise<FollowStatus>} */
    async unfollow(userId) {
        const { data } = await apiClient.delete(`/users/${userId}/follow`)
        return data
    },

    /**
     * GET /users/:userId/follow (public; with a token it also says whether the caller follows).
     * @returns {Promise<FollowStatus>}
     */
    async followStatus(userId, signal) {
        const { data } = await apiClient.get(`/users/${userId}/follow`, { signal })
        return data
    },

    /** GET /users/:userId/followers (public), newest follow first. @returns {Promise<import('./streams').Page<FollowUser>>} */
    async followers(userId, { page = 1, limit = 20 } = {}, signal) {
        const { data } = await apiClient.get(`/users/${userId}/followers`, { params: { page, limit }, signal })
        return data
    },

    /** GET /users/:userId/following (public), newest first. @returns {Promise<import('./streams').Page<FollowUser>>} */
    async following(userId, { page = 1, limit = 20 } = {}, signal) {
        const { data } = await apiClient.get(`/users/${userId}/following`, { params: { page, limit }, signal })
        return data
    },
}

/**
 * @typedef {{following: boolean, followersCount: number}} FollowStatus
 *   `following` is false without a token, and on your own profile
 * @typedef {{userId: string, username: string | null, firstName: string, since: string}} FollowUser
 *   public lists carry no last name; `since` is when the follow happened
 */
