import { useSyncExternalStore } from 'react'

/*
 * Queue of `donation.received` alerts per stream, filled by LiveEventsBridge and drained by the
 * DonationAlerts overlay (one alert on screen at a time). Not query data: alerts are transient.
 */

const MAX_QUEUED = 20
const EMPTY = []
const queues = new Map() // streamId → donation events, oldest first
const listeners = new Set()

const emit = () => listeners.forEach((fn) => fn())

export function pushDonationAlert(donation) {
    const queue = queues.get(donation.streamId) ?? EMPTY
    if (queue.some((item) => item.id === donation.id)) return
    queues.set(donation.streamId, [...queue, donation].slice(-MAX_QUEUED))
    emit()
}

export function dismissDonationAlert(streamId, id) {
    const queue = queues.get(streamId)
    if (!queue?.some((item) => item.id === id)) return
    const rest = queue.filter((item) => item.id !== id)
    if (rest.length) queues.set(streamId, rest)
    else queues.delete(streamId)
    emit()
}

function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

/** @returns {Array<{id: string, streamId: string, donorName: string | null, amount: number, message: string | null, paidAt: string}>} */
export function useDonationAlertQueue(streamId) {
    return useSyncExternalStore(subscribe, () => queues.get(streamId) ?? EMPTY)
}
