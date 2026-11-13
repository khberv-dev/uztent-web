import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { applyAuthResponse } from '@/lib/authSession'

/**
 * POST /auth/password. Sets the first password or changes it.
 * The API revokes every session and returns a new pair for this device, which is stored here.
 */
export function useSetPassword(options) {
    return useMutation({
        mutationKey: ['auth', 'password'],
        mutationFn: async (input) => {
            const data = await authApi.setPassword(input)
            applyAuthResponse(data)
            return data
        },
        ...options,
    })
}
