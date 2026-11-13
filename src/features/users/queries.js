import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { queryKeys } from '@/lib/queryKeys'
import { useIsAuthenticated } from '@/lib/session'

/** GET /users/me. Seeded by every auth response, so it rarely hits the network after sign-in. */
export function useMe() {
    const authenticated = useIsAuthenticated()
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: usersApi.getMe,
        enabled: authenticated,
        staleTime: 5 * 60 * 1000,
    })
}

/** PATCH /users/me with only the changed fields. */
export function useUpdateMe(options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ['users', 'me', 'update'],
        mutationFn: usersApi.updateMe,
        ...options,
        onSuccess: (user, ...rest) => {
            queryClient.setQueryData(queryKeys.me, user)
            // Availability answers may be outdated now (e.g. the old username was released)
            queryClient.removeQueries({ queryKey: ['users', 'username-availability'] })
            options?.onSuccess?.(user, ...rest)
        },
    })
}
