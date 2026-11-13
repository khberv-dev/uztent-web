import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/api/payments'
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

/** Step 1 of adding a card: sends {pan, expiry, phone}; Multicard texts a code. Resolves to the binding. */
export function useAddCard(options) {
    return useMutation({ mutationFn: (card) => paymentsApi.addCard(card), ...options })
}

/** Step 2: the SMS code. The saved card goes to the top of the list (newest first). */
export function useConfirmCardBind(options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ bindId, otp }) => paymentsApi.confirmBind(bindId, otp),
        ...options,
        onSuccess: (card, ...rest) => {
            queryClient.setQueryData(paymentKeys.cards(), (cards) => (cards ? [card, ...cards.filter((c) => c.id !== card.id)] : cards))
            queryClient.invalidateQueries({ queryKey: paymentKeys.cards() })
            options?.onSuccess?.(card, ...rest)
        },
    })
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
