import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { applyAuthResponse } from '@/lib/authSession'

/** POST /auth/google: exchanges a Google ID token for a token pair and stores it. */
export function useGoogleSignIn(options) {
    return useMutation({
        mutationKey: ['auth', 'google'],
        mutationFn: async (idToken) => {
            const data = await authApi.signInWithGoogle(idToken)
            applyAuthResponse(data)
            return data
        },
        ...options,
    })
}
