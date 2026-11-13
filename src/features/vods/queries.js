import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vodsApi } from '@/api/vods'
import { isUuid } from '@/lib/format'
import { nextPageParam } from '@/lib/pagination'

export const vodKeys = {
    all: ['vods'],
    lists: () => ['vods', 'list'],
    mine: () => ['vods', 'list', 'me'],
    byUser: (userId) => ['vods', 'list', 'user', userId],
    detail: (id) => ['vods', 'detail', id],
}

export function useMyVods({ limit = 20, enabled = true } = {}) {
    return useInfiniteQuery({
        enabled,
        queryKey: [...vodKeys.mine(), limit],
        queryFn: ({ pageParam, signal }) => vodsApi.listMine({ page: pageParam, limit }, signal),
        initialPageParam: 1,
        getNextPageParam: nextPageParam,
    })
}

export function useUserVods(userId, { limit = 20 } = {}) {
    return useInfiniteQuery({
        queryKey: [...vodKeys.byUser(userId), limit],
        queryFn: ({ pageParam, signal }) => vodsApi.listByUser(userId, { page: pageParam, limit }, signal),
        initialPageParam: 1,
        getNextPageParam: nextPageParam,
        enabled: isUuid(userId),
    })
}

export function useVod(id, { enabled = true } = {}) {
    return useQuery({
        queryKey: vodKeys.detail(id),
        queryFn: ({ signal }) => vodsApi.get(id, signal),
        enabled: enabled && isUuid(id),
        // Poll while the recording is still being processed
        refetchInterval: (query) => (query.state.data && !query.state.data.videoUri ? 30 * 1000 : false),
    })
}

/** DELETE /vods/:id. Only the owner can delete (403 otherwise). */
export function useDeleteVod(options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id) => vodsApi.remove(id),
        ...options,
        onSuccess: (data, id, ...rest) => {
            queryClient.removeQueries({ queryKey: vodKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: vodKeys.lists() })
            options?.onSuccess?.(data, id, ...rest)
        },
    })
}
