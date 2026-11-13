import { apiClient } from './client'

/*
 * Saved cards, bound through Multicard's card-binding API: the card number and expiry pass through
 * our API to Multicard (never stored there), Multicard texts a code to the card's phone, and the API
 * keeps only Multicard's token (never returned) and the masked number.
 * Never log or persist the card number or expiry on the client either.
 */

/**
 * @typedef {Object} SavedCard
 * @property {string} id
 * @property {string} cardPan  masked, e.g. "986027******1519"
 * @property {'uzcard' | 'humo' | 'visa' | 'mastercard' | 'unionpay'} ps
 * @property {string} createdAt
 */

/**
 * @typedef {Object} CardBinding
 * @property {string} bindId
 * @property {string} cardPan  masked
 * @property {SavedCard['ps']} ps
 * @property {string} expiresAt  enter the code before this (10 minutes)
 */

export const paymentsApi = {
    /** GET /payments/cards, newest first. @returns {Promise<SavedCard[]>} */
    async listCards(signal) {
        const { data } = await apiClient.get('/payments/cards', { signal })
        return data
    },

    /**
     * POST /payments/cards: step 1, Multicard texts a code to the card's phone.
     * @param {{pan: string, expiry: string, phone: string}} card  pan: 16 digits; expiry: "MM/YY"; phone: 998XXXXXXXXX
     * @returns {Promise<CardBinding>}
     */
    async addCard({ pan, expiry, phone }) {
        const { data } = await apiClient.post('/payments/cards', { pan, expiry, phone })
        return data
    },

    /** POST /payments/cards/bind/:bindId/confirm: step 2, the SMS code. @returns {Promise<SavedCard>} */
    async confirmBind(bindId, otp) {
        const { data } = await apiClient.post(`/payments/cards/bind/${bindId}/confirm`, { otp })
        return data
    },

    /** DELETE /payments/cards/:id: removes the card and revokes its token at Multicard. */
    async deleteCard(id) {
        await apiClient.delete(`/payments/cards/${id}`)
    },
}
