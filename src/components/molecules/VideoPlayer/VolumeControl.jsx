import { Icon } from '@/components/atoms'
import styles from './VideoPlayer.module.css'

/** Mute toggle plus a slider that expands on hover/focus. */
export function VolumeControl({ volume, muted, onToggleMute, onVolumeChange }) {
    const effective = muted ? 0 : volume
    const icon = effective === 0 ? 'volumeMute' : effective < 0.5 ? 'volumeLow' : 'volumeHigh'

    return (
        <div className={styles.volume}>
            <button type="button" className={styles.controlButton} onClick={onToggleMute} aria-label={muted ? 'Unmute (m)' : 'Mute (m)'} title={muted ? 'Unmute (m)' : 'Mute (m)'}>
                <Icon name={icon} size={22} />
            </button>
            <input
                type="range"
                className={styles.volumeSlider}
                min={0}
                max={1}
                step={0.05}
                value={effective}
                onChange={(event) => onVolumeChange(Number(event.target.value))}
                onKeyDown={(event) => event.stopPropagation()}
                aria-label="Volume"
                style={{ '--fill': `${effective * 100}%` }}
            />
        </div>
    )
}
