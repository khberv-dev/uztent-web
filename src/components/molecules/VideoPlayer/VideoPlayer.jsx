import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, Spinner, Text } from '@/components/atoms'
import { useMediaState } from '@/hooks/useMediaState'
import { cn } from '@/lib/cn'
import { readPreference, writePreference } from '@/lib/preferences'
import { PlayerControls } from './PlayerControls'
import styles from './VideoPlayer.module.css'

const LIVE_RETRY_MS = 5000
const HIDE_CONTROLS_MS = 3000 // controls hide after this long without input
// Within this many seconds of the live edge counts as "watching live"
const LIVE_THRESHOLD_S = 4
// Without hls.js (native HLS) aim this far behind the end of the playlist
const NATIVE_LIVE_OFFSET_S = 3

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/**
 * HLS player with fully custom controls (no native controls).
 * - Live: seek bar over the server's DVR window, LIVE indicator (red at the live edge, grey and
 *   clickable to jump back when behind), quality menu.
 * - VOD: seek bar over the whole video with buffered range and elapsed / total time.
 * Uses hls.js (loaded on demand) where MSE exists, native HLS otherwise (iOS Safari).
 * Changing `src` swaps the source in place, so fullscreen and volume survive a quality switch.
 *
 * Shortcuts (player focused): space/k play, m mute, f fullscreen, ←/→ seek 5s, ↑/↓ volume.
 *
 * @param {{
 *   src: string, live?: boolean, poster?: string | null,
 *   muted?: boolean,  start muted and don't remember volume (e.g. the streamer's own preview)
 *   qualities?: string[], quality?: string, onQualityChange?: (quality: string) => void,
 * }} props
 */
export function VideoPlayer({ src, live = false, poster, muted: startMuted = false, qualities, quality, onQualityChange }) {
    const containerRef = useRef(null)
    const hlsRef = useRef(null)
    const hideTimerRef = useRef(null)
    // pointerType of the last press: taps behave differently from mouse clicks
    const pointerTypeRef = useRef('mouse')
    // The element lives in a ref for imperative calls (play, seek, volume); the state copy only
    // exists so effects/hooks re-run once it mounts.
    const videoRef = useRef(null)
    const [video, setVideo] = useState(null)
    const attachVideo = useCallback((node) => {
        videoRef.current = node
        setVideo(node)
    }, [])
    // Status is tied to the src it belongs to, so a new src reads as "loading" without a reset effect
    const [load, setLoad] = useState({ src, status: 'loading' }) // loading | ready | waiting | error
    const status = load.src === src ? load.status : 'loading'
    const [fullscreen, setFullscreen] = useState(false)
    const [controlsActive, setControlsActive] = useState(true)
    const [menuOpen, setMenuOpen] = useState(false)

    /**
     * The live DVR window: [oldest position still on the server, live edge].
     * With hls.js, `video.seekable` can start at 0 even though older segments were already deleted
     * from the playlist, so the start comes from the playlist itself.
     */
    const getLiveWindow = useCallback(() => {
        const el = videoRef.current
        if (!el) return { start: 0, edge: 0 }
        const hls = hlsRef.current
        const { seekable } = el
        const seekStart = seekable.length ? seekable.start(0) : 0
        const seekEnd = seekable.length ? seekable.end(seekable.length - 1) : 0
        if (hls) {
            const details = hls.latestLevelDetails ?? hls.levels?.[hls.currentLevel]?.details
            const firstFragment = details?.fragments?.[0]
            const start = firstFragment ? Math.max(seekStart, firstFragment.start) : seekStart
            const synced = hls.liveSyncPosition
            return { start, edge: Number.isFinite(synced) ? synced : seekEnd }
        }
        return { start: seekStart, edge: Math.max(seekStart, seekEnd - NATIVE_LIVE_OFFSET_S) }
    }, [])
    const getLiveEdge = useCallback(() => getLiveWindow().edge, [getLiveWindow])

    const media = useMediaState(video, live ? getLiveWindow : null)
    const behindBy = live ? Math.max(0, media.liveEdge - media.currentTime) : 0
    const atLive = live && !media.paused && behindBy < LIVE_THRESHOLD_S

    /* ------------------------------ volume prefs ------------------------------ */

    useEffect(() => {
        const el = videoRef.current
        if (!el) return
        if (startMuted) {
            el.muted = true
            return
        }
        const volume = Number(readPreference('volume', '1'))
        el.volume = Number.isFinite(volume) ? clamp(volume, 0, 1) : 1
        el.muted = readPreference('muted', 'false') === 'true'
    }, [video, startMuted])

    /* ------------------------------ source loading ------------------------------ */

    useEffect(() => {
        const el = videoRef.current
        if (!el || !src) return undefined
        let hls = null
        let retryTimer = null
        let cancelled = false
        const setStatus = (next) => setLoad({ src, status: next })

        const play = () => {
            el.play().catch(() => {
                // Autoplay with sound blocked: retry muted; the user can unmute
                el.muted = true
                el.play().catch(() => {})
            })
        }
        const onReady = () => setStatus('ready')
        const onNativeError = () => {
            if (!live) return setStatus('error')
            setStatus('waiting')
            retryTimer = setTimeout(() => el.load(), LIVE_RETRY_MS)
        }

        el.addEventListener('canplay', onReady)
        el.addEventListener('playing', onReady)

        import('hls.js').then(({ default: Hls }) => {
            if (cancelled) return
            if (Hls.isSupported()) {
                hls = new Hls({ lowLatencyMode: live })
                hlsRef.current = hls
                hls.on(Hls.Events.MANIFEST_PARSED, play)
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (!data.fatal) return
                    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError()
                    } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR && live) {
                        // Usually: the encoder isn't sending yet / anymore. Keep retrying.
                        setStatus('waiting')
                        clearTimeout(retryTimer)
                        retryTimer = setTimeout(() => hls.loadSource(src), LIVE_RETRY_MS)
                    } else {
                        setStatus('error')
                    }
                })
                hls.loadSource(src)
                hls.attachMedia(el)
            } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
                el.addEventListener('error', onNativeError)
                el.addEventListener('loadedmetadata', play)
                el.src = src
            } else {
                setStatus('error')
            }
        })

        return () => {
            cancelled = true
            clearTimeout(retryTimer)
            hls?.destroy()
            if (hlsRef.current === hls) hlsRef.current = null
            el.removeEventListener('canplay', onReady)
            el.removeEventListener('playing', onReady)
            el.removeEventListener('error', onNativeError)
            el.removeEventListener('loadedmetadata', play)
            if (!hls) {
                el.removeAttribute('src')
                el.load()
            }
        }
    }, [video, src, live])

    /* --------------------------------- fullscreen --------------------------------- */

    useEffect(() => {
        const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    /* ---------------------------------- actions ---------------------------------- */

    const actions = {
        togglePlay() {
            const video = videoRef.current
            if (!video) return
            if (video.paused) video.play().catch(() => {})
            else video.pause()
        },
        toggleMute() {
            const video = videoRef.current
            if (!video) return
            video.muted = !video.muted
            if (!video.muted && video.volume === 0) video.volume = 0.5
            if (!startMuted) writePreference('muted', String(video.muted))
        },
        setVolume(value) {
            const video = videoRef.current
            if (!video) return
            video.volume = clamp(value, 0, 1)
            video.muted = value === 0
            if (!startMuted) {
                writePreference('volume', String(video.volume))
                writePreference('muted', String(video.muted))
            }
        },
        seek(time) {
            const video = videoRef.current
            if (!video) return
            if (live) {
                const edge = getLiveEdge()
                // Dropping the thumb at (or right before) the end means "live"
                const { start } = getLiveWindow()
                video.currentTime = edge - time < 1 ? edge : clamp(time, start, edge)
                if (video.paused) video.play().catch(() => {})
            } else {
                video.currentTime = clamp(time, 0, media.duration || 0)
            }
        },
        goLive() {
            const video = videoRef.current
            if (!video) return
            video.currentTime = getLiveEdge()
            video.play().catch(() => {})
        },
        toggleFullscreen() {
            const container = containerRef.current
            if (!container) return
            if (document.fullscreenElement) document.exitFullscreen?.()
            else if (container.requestFullscreen) container.requestFullscreen().catch(() => {})
            else videoRef.current?.webkitEnterFullscreen?.() // iOS Safari: video-only fullscreen
        },
    }

    /* ---------------------------- controls visibility ---------------------------- */

    const poke = () => {
        setControlsActive(true)
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(() => setControlsActive(false), HIDE_CONTROLS_MS)
    }

    // Playback starting (autoplay, or the play button) counts as activity: hide after the idle delay
    useEffect(() => {
        if (media.paused) return
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(() => setControlsActive(false), HIDE_CONTROLS_MS)
    }, [media.paused])

    useEffect(() => () => clearTimeout(hideTimerRef.current), [])

    const showControls = controlsActive || media.paused || menuOpen || status !== 'ready'

    function handleKeyDown(event) {
        if (event.target.closest('input, [role="menu"]')) return
        const key = event.key.toLowerCase()
        const handlers = {
            ' ': actions.togglePlay,
            k: actions.togglePlay,
            m: actions.toggleMute,
            f: actions.toggleFullscreen,
            arrowleft: () => actions.seek(media.currentTime - 5),
            arrowright: () => actions.seek(media.currentTime + 5),
            arrowup: () => actions.setVolume((media.muted ? 0 : media.volume) + 0.1),
            arrowdown: () => actions.setVolume(media.volume - 0.1),
        }
        const handler = handlers[key]
        if (!handler || (event.target !== containerRef.current && (key === ' ' || key === 'k') && event.target.tagName === 'BUTTON')) return
        event.preventDefault()
        handler()
        poke()
    }

    return (
        <div
            ref={containerRef}
            className={cn(styles.player, !showControls && styles.idle)}
            tabIndex={0}
            aria-label={live ? 'Live video pleyer' : 'Video pleyer'}
            onKeyDown={handleKeyDown}
            onPointerMove={poke}
            onPointerDown={(event) => {
                pointerTypeRef.current = event.pointerType
                poke()
            }}
            // Touch browsers fire pointerleave as soon as the finger lifts; only a mouse really leaves
            onPointerLeave={(event) => event.pointerType === 'mouse' && setControlsActive(false)}
        >
            <video ref={attachVideo} className={styles.video} playsInline poster={poster ?? undefined} />

            {/*
              Mouse: click to play/pause, double-click for fullscreen.
              Touch: a tap only shows the controls (pointerdown already did); play/pause is the button's job.
            */}
            <div
                className={styles.surface}
                onClick={() => pointerTypeRef.current === 'mouse' && actions.togglePlay()}
                onDoubleClick={() => pointerTypeRef.current === 'mouse' && actions.toggleFullscreen()}
                aria-hidden="true"
            />

            {status !== 'ready' ? (
                <div className={styles.overlay} aria-live="polite">
                    {status === 'loading' && <Spinner size="lg" label="Video yuklanmoqda" />}
                    {status === 'waiting' && (
                        <>
                            <Spinner size="lg" label="Video kutilmoqda" />
                            <Text weight="semibold">Stream video yuborishini kutyapmiz…</Text>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <Icon name="alert" size={32} />
                            <Text weight="semibold">Bu videoni ijro etib boʻlmaydi.</Text>
                        </>
                    )}
                </div>
            ) : media.buffering ? (
                <div className={styles.overlay} aria-hidden="true"><Spinner size="lg" label="Yuklanmoqda" /></div>
            ) : media.paused ? (
                <div className={styles.overlay} aria-hidden="true">
                    <span className={styles.bigPlay}><Icon name="play" size={36} /></span>
                </div>
            ) : null}

            {status === 'ready' && (
                <PlayerControls
                    media={media}
                    live={live}
                    atLive={atLive}
                    behindBy={behindBy}
                    fullscreen={fullscreen}
                    actions={actions}
                    qualities={qualities}
                    quality={quality}
                    onQualityChange={onQualityChange}
                    onMenuOpenChange={setMenuOpen}
                />
            )}
        </div>
    )
}
