import { apiClient } from './client'

/**
 * A recorded stream (video on demand). Same id as the stream it came from.
 * @typedef {Object} Vod
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string | null} previewUri  thumbnail; null until the media pipeline fills it in
 * @property {string | null} videoUri    recording; null until processed
 * @property {number} peakViewers
 * @property {string} startedAt
 * @property {string} endedAt
 * @property {string} createdAt
 */

export const vodsApi = {
    /** GET /vods/me, newest first. @returns {Promise<import('./streams').Page<Vod>>} */
    async listMine({ page = 1, limit = 20 } = {}, signal) {
        const { data } = await apiClient.get('/vods/me', { params: { page, limit }, signal })
        return data
    },

    /** GET /users/:userId/vods. Unknown user → empty list. @returns {Promise<import('./streams').Page<Vod>>} */
    async listByUser(userId, { page = 1, limit = 20 } = {}, signal) {
        const { data } = await apiClient.get(`/users/${userId}/vods`, { params: { page, limit }, signal })
        return data
    },

    /** GET /vods/:id. @returns {Promise<Vod>} */
    async get(id, signal) {
        const { data } = await apiClient.get(`/vods/${id}`, { signal })
        return data
    },

    /** DELETE /vods/:id → 204. 403 if it isn't the caller's. */
    async remove(id) {
        await apiClient.delete(`/vods/${id}`)
    },
}
