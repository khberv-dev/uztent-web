import { appendMessage, chatKeys, removeMessage } from './keys'

/*
 * Applies chat WebSocket events to the query cache (called by LiveEventsBridge). The server only
 * sends them for chats this connection joined (useChatRoom → joinChat).
 */

const withSlowMode = (streamId, seconds) => (stream) =>
    stream && stream.id === streamId && stream.chatSlowModeSeconds !== seconds ? { ...stream, chatSlowModeSeconds: seconds } : stream

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function applyChatEvent(queryClient, { event, data }) {
    switch (event) {
        case 'chat.message':
            queryClient.setQueryData(chatKeys.history(data.streamId), (old) => appendMessage(old, data))
            break

        case 'chat.deleted':
            queryClient.setQueryData(chatKeys.history(data.streamId), (old) => removeMessage(old, data.id))
            break

        case 'chat.settings': {
            const { streamId, slowModeSeconds } = data
            queryClient.setQueryData(chatKeys.permissions(streamId), (old) => old && { ...old, slowModeSeconds })
            // The live stream objects carry the slow mode too (see liveEvents.js for these shapes)
            const patch = withSlowMode(streamId, slowModeSeconds)
            queryClient.setQueriesData({ queryKey: ['streams', 'detail'] }, patch)
            queryClient.setQueriesData({ queryKey: ['streams', 'mine'] }, patch)
            queryClient.setQueriesData({ queryKey: ['streams', 'channel'] }, (old) =>
                old?.status === 'live' ? { ...old, stream: patch(old.stream) } : old,
            )
            queryClient.setQueriesData({ queryKey: ['streams', 'list'] }, (old) =>
                old && { ...old, pages: old.pages.map((page) => ({ ...page, items: page.items.map(patch) })) },
            )
            break
        }

        default:
            break
    }
}

/** After a reconnect: chat events were missed, so reload open chats and permissions. */
export function reloadChatData(queryClient) {
    queryClient.invalidateQueries({ queryKey: chatKeys.histories() })
    queryClient.invalidateQueries({ queryKey: chatKeys.permissionsAll() })
}
