import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import styles from './VideoPlayer.module.css'

const KEY_STEP = 5

/**
 * Click/drag seek bar. While dragging only the visuals move; the seek is committed on release,
 * so HLS doesn't reload segments for every pointer move.
 *
 * @param {{
 *   min: number, max: number, value: number, buffered?: number,
 *   onSeek: (time: number) => void,
 *   labelFor: (time: number) => string,   tooltip / aria-valuetext for a position
 *   label: string,
 * }} props
 */
export function Seekbar({ min, max, value, buffered = 0, onSeek, labelFor, label }) {
    const trackRef = useRef(null)
    const [hover, setHover] = useState(null) // fraction under the pointer
    const [drag, setDrag] = useState(null) // fraction while dragging

    const span = Math.max(max - min, 0)
    const disabled = span <= 0
    const toFraction = (time) => (span ? Math.min(Math.max((time - min) / span, 0), 1) : 0)
    const toTime = (fraction) => min + fraction * span

    function fractionAt(clientX) {
        const rect = trackRef.current.getBoundingClientRect()
        return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    }

    function handlePointerDown(event) {
        if (disabled || event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        setDrag(fractionAt(event.clientX))
    }

    function handlePointerMove(event) {
        if (disabled) return
        const fraction = fractionAt(event.clientX)
        setHover(fraction)
        if (drag !== null) setDrag(fraction)
    }

    function handlePointerUp(event) {
        if (drag === null) return
        event.currentTarget.releasePointerCapture(event.pointerId)
        onSeek(toTime(fractionAt(event.clientX)))
        setDrag(null)
    }

    function handleKeyDown(event) {
        if (disabled) return
        const step = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[event.key]
        if (event.key === 'Home') onSeek(min)
        else if (event.key === 'End') onSeek(max)
        else if (step) onSeek(Math.min(Math.max(value + step, min), max))
        else return
        event.preventDefault()
        event.stopPropagation() // don't also trigger the player's shortcuts
    }

    const played = drag ?? toFraction(value)
    const tooltip = drag ?? hover

    return (
        <div
            ref={trackRef}
            className={cn(styles.seekbar, drag !== null && styles.seekbarActive, disabled && styles.seekbarDisabled)}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={Math.round(span)}
            aria-valuenow={Math.round(value - min)}
            aria-valuetext={labelFor(value)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => setDrag(null)}
            onPointerLeave={() => setHover(null)}
            onKeyDown={handleKeyDown}
        >
            <div className={styles.track}>
                <div className={styles.bufferedFill} style={{ width: `${toFraction(buffered) * 100}%` }} />
                <div className={styles.playedFill} style={{ width: `${played * 100}%` }} />
                <div className={styles.thumb} style={{ left: `${played * 100}%` }} />
            </div>
            {tooltip !== null && !disabled && (
                <span className={styles.seekTooltip} style={{ left: `${tooltip * 100}%` }}>
                    {labelFor(toTime(tooltip))}
                </span>
            )}
        </div>
    )
}
