import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { donationsApi } from '@/api/donations'
import { isUuid } from '@/lib/format'
import { donationKeys } from './keys'

export const DONATION_MIN = 1_000
export const DONATION_MAX = 10_000_000
export const DONATION_MESSAGE_MAX = 200

/**
 * Creates the donation. Checkout: the caller opens `checkoutUrl` (Multicard's payment page).
 * With `cardId`: the saved card is charged; the result is `paid`, or `pending` with `otpRequired`.
 */
export function useCreateDonation(options) {
    return useMutation({
        mutationFn: ({ target, ...body }) => donationsApi.create(target, { ...body, lang: 'uz' }),
        ...options,
    })
}

/** Confirms a card donation with the SMS code; the result goes into the donation's cache entry. */
export function useConfirmDonation(options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, otp }) => donationsApi.confirm(id, otp),
        ...options,
        onSuccess: (donation, ...rest) => {
            queryClient.setQueryData(donationKeys.detail(donation.id), donation)
            options?.onSuccess?.(donation, ...rest)
        },
    })
}

const POLL_MS = 2000
const MAX_POLLS = 45 // ~1.5 min: the callback usually lands a moment after the redirect

const stillPolling = (state) => state?.data?.status === 'pending' && !state.data.otpRequired && state.dataUpdateCount < MAX_POLLS

/**
 * GET /donations/:id for the return page. Polls while `pending`, because Multicard can redirect the
 * donor back before its callback has marked the donation paid.
 * `polling` turns false once the donation is final or polling gave up (still `pending` after ~1.5 min).
 */
export function useDonation(id) {
    const queryClient = useQueryClient()
    const query = useQuery({
        queryKey: donationKeys.detail(id),
        queryFn: ({ signal }) => donationsApi.get(id, signal),
        enabled: isUuid(id),
        refetchInterval: (q) => (stillPolling(q.state) ? POLL_MS : false),
    })
    // Reading dataUpdatedAt re-renders on every poll, even when the data itself didn't change
    void query.dataUpdatedAt
    return { ...query, polling: stillPolling(queryClient.getQueryState(donationKeys.detail(id))) }
}

/** Paid donations of a stream, newest first. `donation.received` events prepend new ones. */
export function useStreamDonations(streamId, { limit = 50 } = {}) {
    return useQuery({
        queryKey: donationKeys.stream(streamId),
        queryFn: ({ signal }) => donationsApi.listForStream(streamId, { limit }, signal),
        enabled: isUuid(streamId),
        staleTime: Infinity,
    })
}

