import { useEffect, useState } from 'react'

const EVENTS = [
    'play', 'pause', 'playing', 'waiting', 'seeking', 'seeked', 'timeupdate', 'progress',
    'durationchange', 'loadedmetadata', 'canplay', 'volumechange', 'ended', 'emptied',
]

const INITIAL = {
    paused: true,
    muted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    seekStart: 0,
    seekEnd: 0,
    bufferedEnd: 0,
    liveEdge: 0,
    buffering: false,
}

function lastRangeEnd(ranges) {
    return ranges.length ? ranges.end(ranges.length - 1) : 0
}

/**
 * Snapshot of a <video> element's playback state, re-read on media events and once a second
 * (a live stream's edge keeps moving even while paused).
 * @param {HTMLVideoElement | null} video
 * @param {(() => {start: number, edge: number}) | null} getLiveWindow the live DVR window; omit for VODs
 */
export function useMediaState(video, getLiveWindow) {
    const [state, setState] = useState(INITIAL)

    useEffect(() => {
        if (!video) return undefined
        let buffering = false

        const update = (event) => {
            if (event?.type === 'waiting') buffering = true
            if (event && ['playing', 'canplay', 'seeked', 'pause', 'emptied'].includes(event.type)) buffering = false
            const seekEnd = lastRangeEnd(video.seekable)
            const seekStart = video.seekable.length ? video.seekable.start(0) : 0
            const liveWindow = getLiveWindow?.()
            setState({
                paused: video.paused,
                muted: video.muted,
                volume: video.volume,
                currentTime: video.currentTime,
                duration: Number.isFinite(video.duration) ? video.duration : 0,
                seekStart: liveWindow ? liveWindow.start : seekStart,
                seekEnd,
                bufferedEnd: lastRangeEnd(video.buffered),
                liveEdge: liveWindow ? liveWindow.edge : seekEnd,
                buffering,
            })
        }

        EVENTS.forEach((name) => video.addEventListener(name, update))
        const frame = requestAnimationFrame(() => update())
        const timer = setInterval(update, 1000)
        return () => {
            EVENTS.forEach((name) => video.removeEventListener(name, update))
            cancelAnimationFrame(frame)
            clearInterval(timer)
        }
    }, [video, getLiveWindow])

    return state
}
