import { apiClient } from './client'

/*
 * Saved cards, bound through Multicard's card form: the card number is typed on Multicard's page,
 * and the API keeps only Multicard's token (never returned) and the masked number.
 */

/**
 * @typedef {Object} SavedCard
 * @property {string} id
 * @property {string} cardPan  masked, e.g. "986027******1519"
 * @property {'uzcard' | 'humo' | 'visa' | 'mastercard' | 'unionpay'} ps
 * @property {string} createdAt
 */

export const paymentsApi = {
    /** GET /payments/cards, newest first. @returns {Promise<SavedCard[]>} */
    async listCards(signal) {
        const { data } = await apiClient.get('/payments/cards', { signal })
        return data
    },

    /**
     * POST /payments/cards: starts binding. Send the user to `formUrl`; Multicard brings them back to
     * CARD_BIND_RETURN_URL?bindId=…&result=success|declined.
     * @param {string} phone the card's SMS phone, 998XXXXXXXXX
     * @returns {Promise<{bindId: string, formUrl: string, expiresAt: string}>}
     */
    async startBind(phone) {
        const { data } = await apiClient.post('/payments/cards', { phone })
        return data
    },

    /** GET /payments/cards/bind/:bindId. @returns {Promise<{status: 'pending' | 'active' | 'deleted', card: SavedCard | null}>} */
    async bindStatus(bindId, signal) {
        const { data } = await apiClient.get(`/payments/cards/bind/${bindId}`, { signal })
        return data
    },

    /** DELETE /payments/cards/:id: removes the card and revokes its token at Multicard. */
    async deleteCard(id) {
        await apiClient.delete(`/payments/cards/${id}`)
    },
}
