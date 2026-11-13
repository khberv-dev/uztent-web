import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorStatus } from '@/api/errors'
import { paymentsApi } from '@/api/payments'
import { isUuid } from '@/lib/format'
import { useIsAuthenticated } from '@/lib/session'
import { paymentKeys } from './keys'

export const MAX_CARDS = 10

/** The signed-in user's saved cards, newest first. */
export function useSavedCards({ enabled = true } = {}) {
    const authenticated = useIsAuthenticated()
    return useQuery({
        queryKey: paymentKeys.cards(),
        queryFn: ({ signal }) => paymentsApi.listCards(signal),
        enabled: enabled && authenticated,
    })
}

/** Starts binding; the caller sends the user to `formUrl`. */
export function useStartCardBind(options) {
    return useMutation({ mutationFn: (phone) => paymentsApi.startBind(phone), ...options })
}

const BIND_POLL_MS = 1500
const BIND_MAX_POLLS = 20 // ~30 s, as the API's docs suggest

const bindStillPolling = (state) => state?.data?.status === 'pending' && state.dataUpdateCount < BIND_MAX_POLLS

/**
 * After the card form: polls GET /payments/cards/bind/:bindId until the card is saved (`active`).
 * Multicard's callback and this poll race; whichever comes first saves the card. 404 (expired) and
 * 409 (card linked to another account) are final, so they aren't retried.
 */
export function useCardBind(bindId) {
    const queryClient = useQueryClient()
    const query = useQuery({
        queryKey: paymentKeys.bind(bindId),
        queryFn: async ({ signal }) => {
            const result = await paymentsApi.bindStatus(bindId, signal)
            if (result.status === 'active') queryClient.invalidateQueries({ queryKey: paymentKeys.cards() })
            return result
        },
        enabled: isUuid(bindId),
        retry: (count, error) => ![404, 409].includes(getErrorStatus(error)) && count < 2,
        refetchInterval: (q) => (bindStillPolling(q.state) ? BIND_POLL_MS : false),
        staleTime: Infinity,
    })
    void query.dataUpdatedAt // re-render on every poll
    return { ...query, polling: bindStillPolling(queryClient.getQueryState(paymentKeys.bind(bindId))) }
}

/** Removes a saved card (and revokes its token at Multicard). */
export function useDeleteCard(options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id) => paymentsApi.deleteCard(id),
        ...options,
        onSuccess: (result, id, ...rest) => {
            queryClient.setQueryData(paymentKeys.cards(), (cards) => cards?.filter((card) => card.id !== id))
            options?.onSuccess?.(result, id, ...rest)
        },
    })
}
