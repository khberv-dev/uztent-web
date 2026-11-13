import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { streamsApi } from '@/api/streams'
import { USERNAME_PATTERN, useMe } from '@/features/users'
import { isUuid } from '@/lib/format'
import { nextPageParam } from '@/lib/pagination'

export const streamKeys = {
    all: ['streams'],
    list: () => ['streams', 'list'],
    detail: (id) => ['streams', 'detail', id],
    mine: (userId) => ['streams', 'mine', userId],
    settings: () => ['streams', 'settings'],
    channel: (username) => ['streams', 'channel', username],
}

/** GET /streams/me: the user's stream key and publish URL (null until generated). */
export function useStreamSettings() {
    return useQuery({
        queryKey: streamKeys.settings(),
        queryFn: ({ signal }) => streamsApi.getSettings(signal),
        staleTime: Infinity, // only changes when this user regenerates the key
    })
}

/** POST /streams/me/key: generate or replace the stream key. A running broadcast continues. */
export function useGenerateStreamKey(options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => streamsApi.generateKey(),
        ...options,
        onSuccess: (settings, ...rest) => {
            queryClient.setQueryData(streamKeys.settings(), settings)
            options?.onSuccess?.(settings, ...rest)
        },
    })
}

/** PATCH /streams/me { title }: applies to upcoming broadcasts and renames the current one if live. */
export function useUpdateStreamTitle(options) {
    const queryClient = useQueryClient()
    const { data: me } = useMe()
    return useMutation({
        mutationFn: (title) => streamsApi.updateSettings({ title }),
        ...options,
        onSuccess: (settings, ...rest) => {
            queryClient.setQueryData(streamKeys.settings(), settings)
            // Rename the live session in place, then let lists catch up
            const live = queryClient.getQueryData(streamKeys.mine(me?.id))
            if (live) {
                const renamed = { ...live, title: settings.title }
                queryClient.setQueryData(streamKeys.mine(me?.id), renamed)
                queryClient.setQueryData(streamKeys.detail(live.id), renamed)
                queryClient.invalidateQueries({ queryKey: streamKeys.list() })
            }
            options?.onSuccess?.(settings, ...rest)
        },
    })
}

/** GET /streams as an infinite list ("Show more"). Kept current by WebSocket events (LiveEventsBridge). */
export function useLiveStreams({ limit = 20 } = {}) {
    return useInfiniteQuery({
        queryKey: [...streamKeys.list(), limit],
        queryFn: ({ pageParam, signal }) => streamsApi.list({ page: pageParam, limit }, signal),
        initialPageParam: 1,
        getNextPageParam: nextPageParam,
    })
}

/** GET /streams/:id. A 404 means "not found or already ended" (see useVod for the recording). */
export function useStream(id) {
    return useQuery({
        queryKey: streamKeys.detail(id),
        queryFn: ({ signal }) => streamsApi.get(id, signal),
        enabled: isUuid(id),
    })
}

/**
 * GET /streams/:username: {status: 'live', stream} | {status: 'offline'} | {status: 'not-found'}.
 * WebSocket events flip it live/offline and update viewers (see liveEvents.js).
 */
export function useChannelStream(username) {
    return useQuery({
        queryKey: streamKeys.channel(username),
        queryFn: ({ signal }) => streamsApi.getByUsername(username, signal),
        enabled: USERNAME_PATTERN.test(username ?? ''),
    })
}

/**
 * The current user's live stream, or null.
 * The API has no "my live stream" endpoint (GET /streams/me is the stream key), so this scans GET /streams (100 per page) for the user's id.
 */
export function useMyLiveStream() {
    const { data: me } = useMe()
    return useQuery({
        queryKey: streamKeys.mine(me?.id),
        queryFn: async ({ signal }) => {
            for (let page = 1; ; page++) {
                const result = await streamsApi.list({ page, limit: 100 }, signal)
                const mine = result.items.find((stream) => stream.userId === me.id)
                if (mine) return mine
                if (page * result.limit >= result.total) return null
            }
        },
        enabled: Boolean(me?.id),
        staleTime: 15 * 1000,
        // OBS connecting/disconnecting arrives as stream.started / stream.ended events
    })
}

/**
 * PATCH /streams/me { chatSlowModeSeconds }: 0 turns slow mode off. Applies to the live chat right
 * away (everyone in it gets `chat.settings`) and is kept for future streams.
 */
export function useUpdateChatSlowMode(options) {
    const queryClient = useQueryClient()
    const { data: me } = useMe()
    return useMutation({
        mutationFn: (seconds) => streamsApi.updateSettings({ chatSlowModeSeconds: seconds }),
        ...options,
        onSuccess: (settings, ...rest) => {
            queryClient.setQueryData(streamKeys.settings(), settings)
            const live = queryClient.getQueryData(streamKeys.mine(me?.id))
            if (live) queryClient.setQueryData(streamKeys.mine(me?.id), { ...live, chatSlowModeSeconds: settings.chatSlowModeSeconds })
            options?.onSuccess?.(settings, ...rest)
        },
    })
}
