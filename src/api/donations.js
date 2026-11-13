import { apiClient } from './client'

/**
 * A donation, paid through Multicard's hosted invoice page.
 * @typedef {Object} Donation
 * @property {string} id            also Multicard's invoice_id
 * @property {string} streamId      live stream id (= VOD id after the stream ends)
 * @property {string | null} donorName  null when anonymous
 * @property {boolean} anonymous    guests are always anonymous
 * @property {number} amount        so'm
 * @property {string | null} message  up to 200 characters
 * @property {'pending' | 'paid' | 'failed' | 'expired'} status
 * @property {'checkout' | 'card'} paymentMethod  Multicard's page, or a saved card
 * @property {string | null} checkoutUrl  Multicard payment page, only while pending (checkout only)
 * @property {boolean} otpRequired  card payment waiting for the SMS code (POST /donations/:id/confirm)
 * @property {string | null} expiresAt
 * @property {string | null} paidAt
 * @property {string} createdAt
 */

export const donationsApi = {
    /**
     * POST /streams/:idOrUsername/donations (public; the token, if any, identifies the donor).
     * Checkout: redirect the donor to `checkoutUrl`; Multicard brings them back to DONATION_RETURN_URL?donationId=…
     * With `cardId` (signed in): the saved card is charged directly. The result is usually `paid`, or
     * `pending` with `otpRequired` (confirm with the SMS code). A declined card is 402 with `reason`.
     * @param {string} target live stream id or the streamer's username
     * @param {{amount: number, message?: string, anonymous?: boolean, cardId?: string, lang?: 'uz' | 'ru' | 'en'}} body
     * @returns {Promise<Donation>}
     */
    async create(target, { amount, message, anonymous, cardId, lang = 'uz' }) {
        const body = Object.fromEntries(Object.entries({ amount, message, anonymous, cardId, lang }).filter(([, v]) => v !== undefined))
        const { data } = await apiClient.post(`/streams/${encodeURIComponent(target)}/donations`, body)
        return data
    },

    /** POST /donations/:id/confirm { otp }: completes a card donation that has `otpRequired`. @returns {Promise<Donation>} */
    async confirm(id, otp) {
        const { data } = await apiClient.post(`/donations/${id}/confirm`, { otp })
        return data
    },

    /** GET /donations/:id (public): poll on the return page until status isn't `pending`. @returns {Promise<Donation>} */
    async get(id, signal) {
        const { data } = await apiClient.get(`/donations/${id}`, { signal })
        return data
    },

    /** GET /streams/:id/donations (public): paid donations of a live stream or VOD, newest first. @returns {Promise<Donation[]>} */
    async listForStream(streamId, { limit = 50 } = {}, signal) {
        const { data } = await apiClient.get(`/streams/${streamId}/donations`, { params: { limit }, signal })
        return data
    },
}
