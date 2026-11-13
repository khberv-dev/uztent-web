import { useState } from 'react'
import { readPreference, writePreference } from '@/lib/preferences'
import { VideoPlayer } from '../VideoPlayer'

const SOURCE = 'Source'
const DEFAULT_QUALITY = '720p'

/** Picks the remembered quality, else 720p, else the original broadcast. */
function resolve(options, preferred) {
    return (
        options.find((option) => option.quality === preferred) ??
        options.find((option) => option.quality === DEFAULT_QUALITY) ??
        options[0]
    )
}

/**
 * Live player: maps the API's stream URLs to the player's quality menu.
 * "Source" is the original broadcast; renditions are transcoded copies. Each quality is its own
 * stream (no adaptive bitrate), so switching reloads the source. The choice is remembered.
 *
 * @param {{url: string, renditions?: {quality: string, url: string}[], muted?: boolean}} props
 */
export function LivePlayer({ url, renditions = [], muted = false }) {
    const [preferred, setPreferred] = useState(() => readPreference('liveQuality', DEFAULT_QUALITY))
    const options = [{ quality: SOURCE, url }, ...renditions]
    const selected = resolve(options, preferred)

    return (
        <VideoPlayer
            src={selected.url}
            live
            muted={muted}
            qualities={options.map((option) => option.quality)}
            quality={selected.quality}
            onQualityChange={(quality) => {
                setPreferred(quality)
                writePreference('liveQuality', quality)
            }}
        />
    )
}
