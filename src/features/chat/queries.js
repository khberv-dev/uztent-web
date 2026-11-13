import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { chatApi } from '@/api/chat'
import { joinChat } from '@/api/events'
import { isUuid } from '@/lib/format'
import { useIsAuthenticated } from '@/lib/session'
import { appendMessage, chatKeys, removeMessage } from './keys'

/** Joins the stream's chat on the WebSocket while mounted, so chat events arrive for it. */
export function useChatRoom(streamId) {
    useEffect(() => (isUuid(streamId) ? joinChat(streamId) : undefined), [streamId])
}

/**
 * GET /streams/:id/chat (public), paged back with `before`. Kept current by chat.message /
 * chat.deleted events (chatEvents.js), so it never goes stale on its own.
 */
export function useChatHistory(streamId) {
    return useInfiniteQuery({
        queryKey: chatKeys.history(streamId),
        queryFn: ({ pageParam, signal }) => chatApi.history(streamId, { before: pageParam }, signal),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.items.length ? lastPage.items[0].createdAt : undefined),
        enabled: isUuid(streamId),
        staleTime: Infinity,
    })
}

/** GET /streams/:id/chat/me: role, ban status, slow mode. Only for signed-in users. */
export function useChatPermissions(streamId) {
    const authenticated = useIsAuthenticated()
    return useQuery({
        queryKey: chatKeys.permissions(streamId),
        queryFn: ({ signal }) => chatApi.permissions(streamId, signal),
        enabled: authenticated && isUuid(streamId),
    })
}

export function useSendChatMessage(streamId, options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (text) => chatApi.send(streamId, text),
        ...options,
        onSuccess: (message, ...rest) => {
            // Shown right away; the WebSocket copy is de-duplicated by id
            queryClient.setQueryData(chatKeys.history(streamId), (old) => appendMessage(old, message))
            options?.onSuccess?.(message, ...rest)
        },
    })
}

export function useDeleteChatMessage(streamId, options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (messageId) => chatApi.deleteMessage(streamId, messageId),
        ...options,
        onSuccess: (result, messageId, ...rest) => {
            queryClient.setQueryData(chatKeys.history(streamId), (old) => removeMessage(old, messageId))
            options?.onSuccess?.(result, messageId, ...rest)
        },
    })
}

/** Ban from inside a stream (streamer or moderator): applies to all of the streamer's chats. */
export function useBanInChat(streamId, options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (userId) => chatApi.ban(streamId, userId),
        ...options,
        onSuccess: (...args) => {
            // The streamer banning a moderator also removes the role
            queryClient.invalidateQueries({ queryKey: chatKeys.channel() })
            options?.onSuccess?.(...args)
        },
    })
}

/* ------------------------------ the user's own channel ------------------------------ */

export function useModerators({ enabled = true } = {}) {
    return useQuery({
        queryKey: chatKeys.moderators(),
        queryFn: ({ signal }) => chatApi.listModerators(signal),
        enabled,
    })
}

export function useChatBans({ enabled = true } = {}) {
    return useQuery({
        queryKey: chatKeys.bans(),
        queryFn: ({ signal }) => chatApi.listBans(signal),
        enabled,
    })
}

/** Moderator/ban changes affect both lists (promoting lifts a ban, banning removes the role). */
function useChannelMutation(mutationFn, options) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.channel() })
            options?.onSuccess?.(...args)
        },
    })
}

export const useAddModerator = (options) => useChannelMutation((userId) => chatApi.addModerator(userId), options)
export const useRemoveModerator = (options) => useChannelMutation((userId) => chatApi.removeModerator(userId), options)
export const useBanUser = (options) => useChannelMutation((userId) => chatApi.banUser(userId), options)
export const useUnbanUser = (options) => useChannelMutation((userId) => chatApi.unbanUser(userId), options)
