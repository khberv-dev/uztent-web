import { vodKeys } from '@/features/vods'
import { queryKeys } from '@/lib/queryKeys'

/*
 * Applies WebSocket events (api/events.js) to the TanStack Query cache, so every page that shows
 * live data (home grid, sidebar, stream/channel pages, stream manager) updates without polling.
 * Cache shapes:
 *   ['streams','list',limit]       infinite query: {pages: [{items, total, page, limit}], pageParams}
 *   ['streams','detail',id]        Stream
 *   ['streams','mine',userId]      Stream | null
 *   ['streams','channel',username] {status: 'live', stream} | {status: 'offline'} | {status: 'not-found'}
 */

const LIST = ['streams', 'list']
const DETAIL = ['streams', 'detail']
const MINE = ['streams', 'mine']
const CHANNEL = ['streams', 'channel']

const mapPages = (data, fn) => data && { ...data, pages: data.pages.map(fn) }

function addToList(data, stream) {
    if (!data || data.pages.some((page) => page.items.some((item) => item.id === stream.id))) return data
    return {
        ...data,
        pages: data.pages.map((page, index) => ({
            ...page,
            items: index === 0 ? [stream, ...page.items] : page.items, // newest first
            total: page.total + 1,
        })),
    }
}

function removeFromList(data, id) {
    if (!data || !data.pages.some((page) => page.items.some((item) => item.id === id))) return data
    return mapPages(data, (page) => ({ ...page, items: page.items.filter((item) => item.id !== id), total: Math.max(0, page.total - 1) }))
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function applyServerEvent(queryClient, { event, data }) {
    const meId = queryClient.getQueryData(queryKeys.me)?.id

    switch (event) {
        case 'stream.started': {
            const stream = data
            queryClient.setQueriesData({ queryKey: LIST }, (old) => addToList(old, stream))
            queryClient.setQueryData([...DETAIL, stream.id], stream)
            if (meId && stream.userId === meId) queryClient.setQueryData([...MINE, meId], stream)
            // Events carry userId, not username: offline channel pages re-check themselves
            queryClient.invalidateQueries({ queryKey: CHANNEL, predicate: (query) => query.state.data?.status === 'offline' })
            break
        }

        case 'stream.ended': {
            const { id, userId } = data
            queryClient.setQueriesData({ queryKey: LIST }, (old) => removeFromList(old, id))
            // Refetch → 404 → StreamPage finds the VOD (same id) and redirects to it
            queryClient.invalidateQueries({ queryKey: [...DETAIL, id] })
            if (meId && userId === meId) {
                queryClient.setQueryData([...MINE, meId], null)
                queryClient.invalidateQueries({ queryKey: vodKeys.mine() })
            }
            queryClient.setQueriesData({ queryKey: CHANNEL }, (old) =>
                old?.status === 'live' && old.stream.id === id ? { status: 'offline' } : old,
            )
            queryClient.invalidateQueries({ queryKey: vodKeys.byUser(userId) })
            break
        }

        case 'stream.viewers': {
            const counts = new Map(data.map((item) => [item.id, item.viewers]))
            const withCount = (stream) =>
                stream && counts.has(stream.id) && counts.get(stream.id) !== stream.viewers
                    ? { ...stream, viewers: counts.get(stream.id) }
                    : stream
            queryClient.setQueriesData({ queryKey: LIST }, (old) =>
                mapPages(old, (page) => ({ ...page, items: page.items.map(withCount) })),
            )
            queryClient.setQueriesData({ queryKey: DETAIL }, withCount)
            queryClient.setQueriesData({ queryKey: MINE }, withCount)
            queryClient.setQueriesData({ queryKey: CHANNEL }, (old) =>
                old?.status === 'live' ? { ...old, stream: withCount(old.stream) } : old,
            )
            break
        }

        default:
            break
    }
}

/** After a dropped WebSocket reconnects: events were missed, so reload live data over REST. */
export function reloadLiveData(queryClient) {
    queryClient.invalidateQueries({ queryKey: ['streams'] })
}
