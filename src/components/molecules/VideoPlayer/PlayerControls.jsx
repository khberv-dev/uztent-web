import { Icon } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { formatClock } from '@/lib/format'
import { QualityMenu } from './QualityMenu'
import { Seekbar } from './Seekbar'
import { VolumeControl } from './VolumeControl'
import styles from './VideoPlayer.module.css'

/** The control bar: seek bar on top, then play / volume / live-or-time … quality / fullscreen. */
export function PlayerControls({
    media,
    live,
    atLive,
    behindBy,
    fullscreen,
    actions,
    qualities,
    quality,
    onQualityChange,
    onMenuOpenChange,
}) {
    const seekMin = live ? media.seekStart : 0
    const seekMax = live ? media.liveEdge : media.duration
    const labelFor = live
        ? (time) => (seekMax - time < 1 ? 'Live' : `-${formatClock(seekMax - time)}`)
        : (time) => formatClock(time)

    return (
        <div className={styles.controls} onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
            <Seekbar
                min={seekMin}
                max={seekMax}
                value={Math.min(media.currentTime, seekMax)}
                buffered={media.bufferedEnd}
                onSeek={actions.seek}
                labelFor={labelFor}
                label={live ? 'Vaqtni tanlash (live uchun oxiriga torting)' : 'Vaqtni tanlash'}
            />

            <div className={styles.controlRow}>
                <div className={styles.controlGroup}>
                    <button
                        type="button"
                        className={styles.controlButton}
                        onClick={actions.togglePlay}
                        aria-label={media.paused ? 'Ijro etish (k)' : 'Pauza (k)'}
                        title={media.paused ? 'Ijro etish (k)' : 'Pauza (k)'}
                    >
                        <Icon name={media.paused ? 'play' : 'pause'} size={22} />
                    </button>

                    <VolumeControl
                        volume={media.volume}
                        muted={media.muted}
                        onToggleMute={actions.toggleMute}
                        onVolumeChange={actions.setVolume}
                    />

                    {live ? (
                        <button
                            type="button"
                            className={cn(styles.liveIndicator, atLive && styles.liveIndicatorAtLive)}
                            onClick={actions.goLive}
                            disabled={atLive}
                            aria-label={atLive ? 'Live koʻryapsiz' : 'Live’ga qaytish'}
                            title={atLive ? 'Live koʻryapsiz' : 'Live’ga qaytish'}
                        >
                            <span className={styles.liveDot} aria-hidden="true" />
                            Live
                            {!atLive && behindBy >= 1 && <span className={styles.liveBehind}>-{formatClock(behindBy)}</span>}
                        </button>
                    ) : (
                        <span className={styles.time}>
                            {formatClock(media.currentTime)} / {formatClock(media.duration)}
                        </span>
                    )}
                </div>

                <div className={styles.controlGroup}>
                    {qualities?.length > 1 && (
                        <QualityMenu qualities={qualities} quality={quality} onChange={onQualityChange} onOpenChange={onMenuOpenChange} />
                    )}
                    <button
                        type="button"
                        className={styles.controlButton}
                        onClick={actions.toggleFullscreen}
                        aria-label={fullscreen ? 'Toʻliq ekrandan chiqish (f)' : 'Toʻliq ekran (f)'}
                        title={fullscreen ? 'Toʻliq ekrandan chiqish (f)' : 'Toʻliq ekran (f)'}
                    >
                        <Icon name={fullscreen ? 'minimize' : 'maximize'} size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}
