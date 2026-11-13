import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { isUuid } from '@/lib/format'
import { nextPageParam } from '@/lib/pagination'
import { followKeys } from './keys'

/** Followers count, and whether the caller follows `userId` (always false when signed out). */
export function useFollowStatus(userId) {
    return useQuery({
        queryKey: followKeys.status(userId),
        queryFn: ({ signal }) => usersApi.followStatus(userId, signal),
        enabled: isUuid(userId),
        staleTime: 60 * 1000,
    })
}

/**
 * Follows or unfollows `userId` (variables: `true` to follow). The response carries the new status,
 * so the button updates without another request; the lists that changed are refetched.
 */
export function useSetFollowing(userId, options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (follow) => (follow ? usersApi.follow(userId) : usersApi.unfollow(userId)),
        ...options,
        onSuccess: (status, ...rest) => {
            queryClient.setQueryData(followKeys.status(userId), status)
            queryClient.invalidateQueries({ queryKey: followKeys.lists() })
            options?.onSuccess?.(status, ...rest)
        },
    })
}

function useFollowList(key, fetchPage, userId, { limit = 20, enabled = true } = {}) {
    return useInfiniteQuery({
        queryKey: [...key, limit],
        queryFn: ({ pageParam, signal }) => fetchPage(userId, { page: pageParam, limit }, signal),
        initialPageParam: 1,
        getNextPageParam: nextPageParam,
        enabled: enabled && isUuid(userId),
    })
}

/** Who follows `userId`, newest first. */
export const useFollowers = (userId, options) => useFollowList(followKeys.followers(userId), usersApi.followers, userId, options)

/** Whom `userId` follows, newest first. */
export const useFollowing = (userId, options) => useFollowList(followKeys.following(userId), usersApi.following, userId, options)

