import { apiClient } from './client'

/**
 * A live session. Started/ended by the media server (webhooks) when the encoder connects/disconnects,
 * not by the app. Becomes a VOD with the same id when it ends.
 * @typedef {Object} Stream
 * @property {string} id         uuid; also the media server path and the future VOD id
 * @property {string} userId
 * @property {string} title      copied from the stream settings; PATCH /streams/me renames it while live
 * @property {string} startedAt
 * @property {number} viewers    current viewers (all qualities); updated live by `stream.viewers` events
 * @property {string} url        HLS playlist of the original broadcast ("Source")
 * @property {Rendition[]} renditions  transcoded qualities, highest first
 * @property {number} chatSlowModeSeconds  seconds viewers wait between chat messages (0 = off)
 */

/**
 * One transcoded quality. Each is a separate HLS stream (no adaptive bitrate), and its URL stays
 * the same across a user's broadcasts.
 * @typedef {{quality: string, url: string}} Rendition
 */

/**
 * The user's stream settings. One per user, created by the first key generation; reused across streams.
 * @typedef {Object} StreamSettings
 * @property {string} id
 * @property {string} title       1–140 characters, default "Untitled stream"; used for upcoming and current broadcasts
 * @property {number} chatSlowModeSeconds  0–3600 (0 = off); applies to upcoming broadcasts and immediately to a live one
 * @property {string} streamKey         secret, e.g. "sk_…"; only returned to its owner
 * @property {string} encoderStreamKey  what OBS needs as "Stream Key": "<id>?key=<streamKey>" (secret)
 * @property {string} publishUrl  ingest server, e.g. "rtmp://localhost:1935/live"
 * @property {string} createdAt
 * @property {string} updatedAt   changes each time the key is replaced
 */

/**
 * @template T
 * @typedef {{items: T[], total: number, page: number, limit: number}} Page
 */

export const streamsApi = {
    /** GET /streams/me → stream key + publish URL, or null if no key was ever generated (404). @returns {Promise<StreamSettings | null>} */
    async getSettings(signal) {
        try {
            const { data } = await apiClient.get('/streams/me', { signal })
            return data
        } catch (error) {
            if (error.response?.status === 404) return null
            throw error
        }
    },

    /**
     * PATCH /streams/me { title?, chatSlowModeSeconds? }. Send only what changes (unknown fields get 400).
     * 404 if no settings yet (no key generated). A slow mode change is pushed to the chat as `chat.settings`.
     * @param {{title?: string, chatSlowModeSeconds?: number}} patch
     * @returns {Promise<StreamSettings>}
     */
    async updateSettings(patch) {
        const body = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
        const { data } = await apiClient.patch('/streams/me', body)
        return data
    },

    /**
     * POST /streams/me/key: creates the key, or replaces it (keeps the title).
     * The old key stops working for new broadcasts; one already running continues.
     * @returns {Promise<StreamSettings>}
     */
    async generateKey() {
        const { data } = await apiClient.post('/streams/me/key')
        return data
    },

    /** GET /streams (public), newest first. Kept current by WebSocket events. @returns {Promise<Page<Stream>>} */
    async list({ page = 1, limit = 20 } = {}, signal) {
        const { data } = await apiClient.get('/streams', { params: { page, limit }, signal })
        return data
    },

    /**
     * GET /streams/:username (public): a channel's live status.
     * 404 "User is not live" → offline; 404 "User not found" → no such user.
     * @returns {Promise<{status: 'live', stream: Stream} | {status: 'offline'} | {status: 'not-found'}>}
     */
    async getByUsername(username, signal) {
        try {
            const { data } = await apiClient.get(`/streams/${encodeURIComponent(username)}`, { signal })
            return { status: 'live', stream: data }
        } catch (error) {
            if (error.response?.status === 404) {
                return error.response.data?.message === 'User is not live' ? { status: 'offline' } : { status: 'not-found' }
            }
            throw error
        }
    },

    /** GET /streams/:id. 404 "Stream not found" also means "ended": look for a VOD with the same id. @returns {Promise<Stream>} */
    async get(id, signal) {
        const { data } = await apiClient.get(`/streams/${id}`, { signal })
        return data
    },
}
