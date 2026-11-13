export const chatKeys = {
    all: ['chat'],
    histories: () => ['chat', 'history'],
    history: (streamId) => ['chat', 'history', streamId],
    permissionsAll: () => ['chat', 'me'],
    permissions: (streamId) => ['chat', 'me', streamId],
    channel: () => ['chat', 'channel'],
    moderators: () => ['chat', 'channel', 'moderators'],
    bans: () => ['chat', 'channel', 'bans'],
}

/** Keeps memory bounded in long streams: older messages can be loaded again with "Load older". */
const MAX_LIVE_MESSAGES = 500

/*
 * History cache shape (infinite query): pages[0] is the newest page, later pages are older.
 * Each page is {items (oldest first), hasMore}. Live messages are appended to pages[0].
 */

/** All messages, oldest first. */
export function flattenChat(data) {
    if (!data) return []
    return [...data.pages].reverse().flatMap((page) => page.items)
}

export function appendMessage(data, message) {
    if (!data || data.pages.some((page) => page.items.some((item) => item.id === message.id))) return data
    const [newest, ...older] = data.pages
    const items = [...newest.items, message]
    if (items.length <= MAX_LIVE_MESSAGES) {
        return { ...data, pages: [{ ...newest, items }, ...older] }
    }
    // Drop the oldest messages and the older pages; "Load older" fetches them again
    return {
        pages: [{ items: items.slice(-MAX_LIVE_MESSAGES), hasMore: true }],
        pageParams: [data.pageParams[0]],
    }
}

export function removeMessage(data, id) {
    if (!data || !data.pages.some((page) => page.items.some((item) => item.id === id))) return data
    return { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.filter((item) => item.id !== id) })) }
}
