import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { monetizationApi } from '@/api/monetization'
import { nextPageParam } from '@/lib/pagination'
import { donationKeys } from './keys'

const DAY_MS = 24 * 3600 * 1000
const TASHKENT_OFFSET_MS = 5 * 3600 * 1000 // UTC+5, no DST

/** Today's date in Tashkent as YYYY-MM-DD, shifted by `offsetDays`. */
export function tashkentDay(offsetDays = 0, now = Date.now()) {
    return new Date(now + TASHKENT_OFFSET_MS + offsetDays * DAY_MS).toISOString().slice(0, 10)
}

/** Headline numbers: today, 7 / 30 days, all time, average, largest, donors. */
export function useEarningsSummary() {
    return useQuery({
        queryKey: donationKeys.summary(),
        queryFn: ({ signal }) => monetizationApi.summary(signal),
    })
}

/** Paid totals per Tashkent day for the last `days` days (today included), oldest first. */
export function useDailyEarnings(days = 30) {
    return useQuery({
        queryKey: donationKeys.daily(days),
        queryFn: ({ signal }) => monetizationApi.daily({ from: tashkentDay(-(days - 1)), to: tashkentDay() }, signal),
        placeholderData: (previous) => previous,
    })
}

/** Donations the caller received, newest first. @param {{status?: string, streamId?: string}} filters */
export function useReceivedDonations(filters = {}, { limit = 20 } = {}) {
    return useInfiniteQuery({
        queryKey: donationKeys.received({ ...filters, limit }),
        queryFn: ({ pageParam, signal }) => monetizationApi.donations({ ...filters, page: pageParam, limit }, signal),
        initialPageParam: 1,
        getNextPageParam: nextPageParam,
    })
}

/** Earnings per stream / VOD, most recent first (only streams with at least one paid donation). */
export function useStreamEarnings({ limit = 20 } = {}) {
    return useInfiniteQuery({
        queryKey: [...donationKeys.byStream(), limit],
        queryFn: ({ pageParam, signal }) => monetizationApi.streams({ page: pageParam, limit }, signal),
        initialPageParam: 1,
        getNextPageParam: nextPageParam,
    })
}

/** Named donors ranked by total paid. `days` limits it to the last N days; omit for all time. */
export function useTopDonors({ days, limit = 10 } = {}) {
    return useQuery({
        queryKey: donationKeys.topDonors({ days, limit }),
        queryFn: ({ signal }) =>
            monetizationApi.topDonors({ from: days ? new Date(Date.now() - days * DAY_MS).toISOString() : undefined, limit }, signal),
        placeholderData: (previous) => previous,
    })
}
