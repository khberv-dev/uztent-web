import { apiClient } from './client'

/**
 * A chat message. Stored under the live stream id, which becomes the VOD id, so the chat is kept for replay.
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} streamId    live stream id (= VOD id)
 * @property {string} userId      sender
 * @property {string} senderName  username, or first name if they had none, at the time of sending
 * @property {'streamer' | 'moderator' | null} senderRole  badge at the time of sending
 * @property {string} text        1–500 characters, trimmed
 * @property {string} createdAt
 */

/**
 * The caller's permissions in one chat (GET /streams/:id/chat/me).
 * @typedef {{role: 'streamer' | 'moderator' | 'viewer', banned: boolean, slowModeSeconds: number, canModerate: boolean}} ChatPermissions
 */

/**
 * A moderator or banned user of the caller's channel.
 * @typedef {{userId: string, username: string | null, firstName: string, lastName: string, since: string}} ChannelUser
 */

export const chatApi = {
    /**
     * GET /streams/:id/chat (public): newest `limit` messages, oldest first. Works for VODs too.
     * Page back with `before` = the oldest `createdAt` you have.
     * @returns {Promise<{items: ChatMessage[], hasMore: boolean}>}
     */
    async history(streamId, { before, limit = 50 } = {}, signal) {
        const { data } = await apiClient.get(`/streams/${streamId}/chat`, { params: { limit, before }, signal })
        return data
    },

    /**
     * POST /streams/:id/chat { text }. Live streams only.
     * 429 = rate limit or slow mode (message says how long), 403 = banned, 404 = stream ended.
     * @returns {Promise<ChatMessage>}
     */
    async send(streamId, text) {
        const { data } = await apiClient.post(`/streams/${streamId}/chat`, { text })
        return data
    },

    /** GET /streams/:id/chat/me. @returns {Promise<ChatPermissions>} */
    async permissions(streamId, signal) {
        const { data } = await apiClient.get(`/streams/${streamId}/chat/me`, { signal })
        return data
    },

    /** DELETE /streams/:id/chat/:messageId (streamer or moderator, live or VOD). */
    async deleteMessage(streamId, messageId) {
        await apiClient.delete(`/streams/${streamId}/chat/${messageId}`)
    },

    /** POST /streams/:id/chat/bans: bans from all of this streamer's chats (streamer or moderator). */
    async ban(streamId, userId) {
        await apiClient.post(`/streams/${streamId}/chat/bans`, { userId })
    },

    /** DELETE /streams/:id/chat/bans/:userId (streamer or moderator). */
    async unban(streamId, userId) {
        await apiClient.delete(`/streams/${streamId}/chat/bans/${userId}`)
    },

    /* --------------------------- the caller's own channel --------------------------- */

    /** GET /streams/me/moderators, most recently added first. @returns {Promise<ChannelUser[]>} */
    async listModerators(signal) {
        const { data } = await apiClient.get('/streams/me/moderators', { signal })
        return data
    },

    /** POST /streams/me/moderators { userId }. Promoting a banned user lifts the ban. */
    async addModerator(userId) {
        await apiClient.post('/streams/me/moderators', { userId })
    },

    /** DELETE /streams/me/moderators/:userId */
    async removeModerator(userId) {
        await apiClient.delete(`/streams/me/moderators/${userId}`)
    },

    /** GET /streams/me/bans, newest first. @returns {Promise<ChannelUser[]>} */
    async listBans(signal) {
        const { data } = await apiClient.get('/streams/me/bans', { signal })
        return data
    },

    /** POST /streams/me/bans { userId }. Banning a moderator also removes the role. */
    async banUser(userId) {
        await apiClient.post('/streams/me/bans', { userId })
    },

    /** DELETE /streams/me/bans/:userId */
    async unbanUser(userId) {
        await apiClient.delete(`/streams/me/bans/${userId}`)
    },
}
