import { donationKeys } from './keys'

/**
 * `donation.received` goes to the stream room (clients that sent chat.join for the stream).
 * Adds the donation to that stream's list, which the chat shows as a highlighted row.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export function applyDonationEvent(queryClient, { event, data }) {
    if (event !== 'donation.received') return
    queryClient.setQueryData(donationKeys.stream(data.streamId), (old) =>
        old && !old.some((item) => item.id === data.id)
            ? [{ ...data, anonymous: data.donorName === null, status: 'paid', checkoutUrl: null, createdAt: data.paidAt }, ...old]
            : old,
    )
}

/** After a reconnect: donation events were missed, so reload the lists. */
export function reloadDonationData(queryClient) {
    queryClient.invalidateQueries({ queryKey: donationKeys.streams() })
}
