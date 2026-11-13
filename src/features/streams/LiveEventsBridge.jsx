import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { subscribeEvents } from '@/api/events'
import { applyChatEvent, reloadChatData } from '@/features/chat'
import { applyServerEvent, reloadLiveData } from './liveEvents'

/** Mounted once in App: keeps the shared WebSocket open and feeds its events into the query cache. */
export function LiveEventsBridge() {
    const queryClient = useQueryClient()

    useEffect(
        () =>
            subscribeEvents(
                (event) => {
                    if (event.event.startsWith('chat.')) applyChatEvent(queryClient, event)
                    else applyServerEvent(queryClient, event)
                },
                () => {
                    reloadLiveData(queryClient)
                    reloadChatData(queryClient)
                },
            ),
        [queryClient],
    )

    return null
}
