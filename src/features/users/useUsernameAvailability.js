import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { USERNAME_PATTERN } from './validation'

export const usernameAvailabilityKey = (username) => ['users', 'username-availability', username]

/**
 * Live username availability check, debounced while the user types.
 * Only well-formed usernames that differ from the current one hit the API.
 *
 * @param {string} value raw input value
 * @param {string | null} currentUsername the user's saved username
 * @returns {{status: 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error', username: string}}
 */
export function useUsernameAvailability(value, currentUsername, delay = 300) {
    // Same normalization as the API: trim + lowercase
    const username = value.trim().toLowerCase()
    const debounced = useDebouncedValue(username, delay)
    const shouldCheck = USERNAME_PATTERN.test(debounced) && debounced !== currentUsername

    const query = useQuery({
        queryKey: usernameAvailabilityKey(debounced),
        // TanStack Query aborts the request if the key changes before it finishes
        queryFn: ({ signal }) => usersApi.checkUsernameAvailability(debounced, signal),
        enabled: shouldCheck,
        staleTime: 30 * 1000,
        retry: false,
    })

    if (!username || username === currentUsername) return { status: 'idle', username }
    if (!USERNAME_PATTERN.test(username)) return { status: 'invalid', username }
    // Still typing (debounce pending) or request in flight
    if (username !== debounced || query.isPending) return { status: 'checking', username }
    if (query.isError) return { status: 'error', username }
    return { status: query.data.available ? 'available' : 'taken', username }
}
