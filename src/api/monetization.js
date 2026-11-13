import { apiClient } from './client'

/*
 * Earnings of the caller's own channel (the channel always comes from the access token).
 * Totals count only `paid` donations, amounts are so'm, days are Asia/Tashkent calendar days.
 */

/**
 * A donation as the streamer sees it: the public shape plus the donor's id (null for guests and
 * anonymous donations) and the card system Multicard reported.
 * @typedef {import('./donations').Donation & {donorId: string | null, paymentSystem: string | null}} ReceivedDonation
 */

const defined = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const monetizationApi = {
    /** GET /monetization/summary: all time, today, 7 / 30 days, average, largest, donors. */
    async summary(signal) {
        const { data } = await apiClient.get('/monetization/summary', { signal })
        return data
    },

    /**
     * GET /monetization/donations, newest first.
     * @param {{status?: 'paid' | 'pending' | 'expired' | 'failed' | 'all', streamId?: string, from?: string, to?: string, page?: number, limit?: number}} params
     * @returns {Promise<import('./streams').Page<ReceivedDonation>>}
     */
    async donations(params = {}, signal) {
        const { data } = await apiClient.get('/monetization/donations', { params: defined(params), signal })
        return data
    },

    /** GET /monetization/daily: one entry per Tashkent day, oldest first. `from`/`to` are YYYY-MM-DD, inclusive. */
    async daily({ from, to } = {}, signal) {
        const { data } = await apiClient.get('/monetization/daily', { params: defined({ from, to }), signal })
        return data
    },

    /** GET /monetization/streams: paid totals per stream / VOD, most recent first. */
    async streams({ page = 1, limit = 20 } = {}, signal) {
        const { data } = await apiClient.get('/monetization/streams', { params: { page, limit }, signal })
        return data
    },

    /** GET /monetization/top-donors: named (non-anonymous) donors ranked by total paid. */
    async topDonors({ from, to, limit = 10 } = {}, signal) {
        const { data } = await apiClient.get('/monetization/top-donors', { params: defined({ from, to, limit }), signal })
        return data
    },
}
