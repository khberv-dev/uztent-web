import { env } from '@/config/env'

/*
 * Real-time events from the API's WebSocket (ws://host:port/ws, public; clients only send chat.join / chat.leave).
 * Messages are {event, data}:
 *   stream.started  data: Stream (same shape as GET /streams/:id)
 *   stream.ended    data: {id, userId, vodId}   (vodId === id)
 *   stream.viewers  data: [{id, viewers}]       (every live stream, every ~5 s)
 * and, only for chats this connection joined (joinChat):
 *   chat.message    data: ChatMessage
 *   chat.deleted    data: {id, streamId}
 *   chat.settings   data: {streamId, slowModeSeconds}
 *   donation.received data: {id, streamId, donorName, amount, message, paidAt}
 *
 * One shared connection: opened with the first subscriber, closed with the last, reconnected with
 * backoff (1 s … 30 s). Events missed while disconnected are NOT replayed, so `onReconnect`
 * subscribers must reload their state over REST.
 */

const listeners = new Set()
const reconnectListeners = new Set()
let socket = null
let retries = 0
let reconnectTimer
/** streamId → number of components showing that chat. Joins belong to the connection. */
const joinedChats = new Map()

function sendToServer(event, data) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ event, data }))
}

function connect() {
    reconnectTimer = undefined
    let ws
    try {
        ws = new WebSocket(env.wsUrl)
    } catch {
        scheduleReconnect()
        return
    }
    socket = ws

    ws.onopen = () => {
        // (Re)join every chat in use: joins don't survive a reconnect
        for (const streamId of joinedChats.keys()) sendToServer('chat.join', { streamId })
        if (retries > 0) reconnectListeners.forEach((fn) => fn())
        retries = 0
    }
    ws.onmessage = (message) => {
        let event
        try {
            event = JSON.parse(String(message.data))
        } catch {
            return
        }
        if (event && typeof event.event === 'string') listeners.forEach((fn) => fn(event))
    }
    ws.onclose = () => {
        if (socket !== ws) return // replaced or closed on purpose
        socket = null
        scheduleReconnect()
    }
}

function scheduleReconnect() {
    if (listeners.size === 0 || reconnectTimer) return
    const delay = Math.min(30_000, 1000 * 2 ** retries++)
    reconnectTimer = setTimeout(connect, delay)
}

/**
 * @param {(event: {event: string, data: any}) => void} listener
 * @param {() => void} [onReconnect] runs after a dropped connection is restored
 * @returns {() => void} unsubscribe
 */
export function subscribeEvents(listener, onReconnect) {
    listeners.add(listener)
    if (onReconnect) reconnectListeners.add(onReconnect)
    if (!socket && !reconnectTimer) connect()

    return () => {
        listeners.delete(listener)
        if (onReconnect) reconnectListeners.delete(onReconnect)
        if (listeners.size === 0) {
            clearTimeout(reconnectTimer)
            reconnectTimer = undefined
            const ws = socket
            socket = null
            ws?.close()
            retries = 0
        }
    }
}

/**
 * Receive chat.message / chat.deleted / chat.settings for one stream. Ref-counted: `chat.join` is sent
 * for the first user of a chat and `chat.leave` after the last. Needs an active subscribeEvents()
 * (LiveEventsBridge) to keep the socket open. The server allows at most 10 chats per connection.
 * @returns {() => void} leave
 */
export function joinChat(streamId) {
    const count = joinedChats.get(streamId) ?? 0
    joinedChats.set(streamId, count + 1)
    if (count === 0) sendToServer('chat.join', { streamId })

    let left = false
    return () => {
        if (left) return
        left = true
        const remaining = (joinedChats.get(streamId) ?? 1) - 1
        if (remaining > 0) {
            joinedChats.set(streamId, remaining)
            return
        }
        joinedChats.delete(streamId)
        sendToServer('chat.leave', { streamId })
    }
}
