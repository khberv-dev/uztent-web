import { displayName } from '@/features/auth'

/**
 * Streams and VODs only carry `userId`, and the API has no public user lookup yet,
 * so other streamers can't be named. The current user's own content shows their name.
 */
export function streamerName(userId, me) {
    if (me && userId === me.id) return displayName(me)
    return 'Streamer'
}
