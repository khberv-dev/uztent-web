import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { applyAuthResponse } from '@/lib/authSession'

/** POST /auth/login with { login (email or username), password }. */
export function usePasswordLogin(options) {
    return useMutation({
        mutationKey: ['auth', 'login'],
        mutationFn: async (credentials) => {
            const data = await authApi.login(credentials)
            applyAuthResponse(data)
            return data
        },
        ...options,
    })
}
