import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getErrorMessage, getErrorStatus, getValidationErrors } from '@/api/errors'
import { Badge, Button, Card, Heading, Icon, Skeleton, Text } from '@/components/atoms'
import { Alert, FormField, LivePlayer, StatCard } from '@/components/molecules'
import { useMyLiveStream, useStreamSettings, useUpdateStreamTitle } from '@/features/streams'
import { useMe } from '@/features/users'
import { useNow } from '@/hooks/useNow'
import { formatCount, formatDuration } from '@/lib/format'
import { paths } from '@/routes/paths'
import styles from './GoLivePanel.module.css'

const TITLE_MAX = 140
const timeFormat = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' })

/** Ticks every second on its own, so only this value re-renders. */
function LiveTime({ startedAt }) {
    const now = useNow()
    return formatDuration(startedAt, new Date(now).toISOString())
}

const PEAK_KEY = 'uztent.peakViewers'

function readStoredPeak(streamId) {
    try {
        const stored = JSON.parse(sessionStorage.getItem(PEAK_KEY) ?? 'null')
        return stored?.id === streamId ? stored.value : 0
    } catch {
        return 0
    }
}

/**
 * Highest viewer count seen for the current session. The API only reports a peak on the VOD after
 * the stream ends, so while live it's tracked here from `stream.viewers` updates, and kept in
 * sessionStorage so a reload doesn't reset it.
 */
function usePeakViewers(stream) {
    const id = stream?.id ?? null
    const viewers = stream?.viewers ?? 0
    const [peak, setPeak] = useState({ id: null, value: 0 })

    if (id && (peak.id !== id || viewers > peak.value)) {
        const base = peak.id === id ? peak.value : readStoredPeak(id)
        setPeak({ id, value: Math.max(base, viewers) })
    }

    useEffect(() => {
        if (!peak.id) return
        try {
            sessionStorage.setItem(PEAK_KEY, JSON.stringify(peak))
        } catch {
            // storage unavailable: the peak lasts until reload
        }
    }, [peak])

    return id && peak.id === id ? peak.value : null
}

/** Session stats: live time, viewers (from `stream.viewers` WebSocket events) and peak viewers. */
function StreamStats({ stream, loading }) {
    const peak = usePeakViewers(stream)

    if (loading) {
        return (
            <div className={styles.stats}>
                {[0, 1, 2].map((i) => <Skeleton key={i} className={styles.statSkeleton} />)}
            </div>
        )
    }

    const live = Boolean(stream)
    return (
        <div className={styles.stats}>
            <StatCard
                icon="clock"
                label="Live time"
                active={live}
                value={live ? <LiveTime startedAt={stream.startedAt} /> : 'Offline'}
                hint={live ? `Started at ${timeFormat.format(new Date(stream.startedAt))}` : 'Start streaming in your encoder to go live'}
            />
            <StatCard
                icon="eye"
                label="Viewers"
                active={live}
                value={live ? formatCount(stream.viewers) : '—'}
                hint="Watching now, across all qualities"
            />
            <StatCard
                icon="broadcast"
                label="Peak viewers"
                active={live}
                value={live && peak !== null ? formatCount(peak) : '—'}
                hint="Highest viewer count this stream (since this page was opened in this tab)"
            />
        </div>
    )
}

/** "Copy link" for the public stream page: /w/:username, or /streams/:id until the user picks a username. */
function CopyStreamLink({ stream }) {
    const { data: me } = useMe()
    const [state, setState] = useState('idle') // idle | copied | failed
    const path = me?.username ? paths.channel(me.username) : paths.stream(stream.id)
    const url = `${window.location.origin}${path}`

    useEffect(() => {
        if (state === 'idle') return undefined
        const timer = setTimeout(() => setState('idle'), 2000)
        return () => clearTimeout(timer)
    }, [state])

    async function copy() {
        try {
            await navigator.clipboard.writeText(url)
            setState('copied')
        } catch {
            setState('failed')
        }
    }

    return (
        <Button
            variant="secondary"
            leftIcon={<Icon name={state === 'copied' ? 'check' : 'copy'} size={16} />}
            title={url}
            onClick={copy}
        >
            {state === 'copied' ? 'Copied!' : state === 'failed' ? 'Couldn’t copy' : 'Copy link'}
        </Button>
    )
}

function LiveStatus({ stream }) {
    return (
        <Card padding="md" className={styles.statusCard}>
            <LivePlayer url={stream.url} renditions={stream.renditions} muted />
            <div className={styles.statusRow}>
                <Badge variant="live">Live</Badge>
                <Heading level={3} className={styles.statusTitle}>{stream.title}</Heading>
            </div>
            <div className={styles.statusFooter}>
                <Text size="sm" tone="muted">To end the stream, stop streaming in your encoder.</Text>
                <CopyStreamLink stream={stream} />
            </div>
        </Card>
    )
}

function OfflineStatus({ hasKey }) {
    return (
        <Card padding="md" className={styles.statusCard}>
            <div className={styles.offline}>
                <Icon name="broadcast" size={36} />
                <Heading level={3}>You’re offline</Heading>
                <Text tone="muted">
                    {hasKey
                        ? 'Start streaming in your encoder and you’ll go live automatically. This page updates on its own.'
                        : 'You need a stream key to go live.'}
                </Text>
                {!hasKey && (
                    <Button as={Link} to={paths.dashboard.settings}>Get a stream key</Button>
                )}
            </div>
        </Card>
    )
}

function StreamTitleForm({ settings }) {
    const [title, setTitle] = useState(() => settings?.title ?? '')
    const [error, setError] = useState(null)
    const [saved, setSaved] = useState(false)
    const disabled = !settings

    const { mutate, isPending } = useUpdateStreamTitle({
        onSuccess: (updated) => {
            setTitle(updated.title)
            setSaved(true)
        },
        onError: (err) => {
            if (getErrorStatus(err) === 404) return setError('Generate a stream key in stream settings first.')
            const result = getValidationErrors(err, ['title'])
            setError(result.fieldErrors.title ?? result.formError)
        },
    })

    const trimmed = title.trim()
    const dirty = Boolean(settings) && trimmed !== settings.title

    function handleSubmit(event) {
        event.preventDefault()
        if (!trimmed) return setError('Give your stream a title.')
        if (trimmed.length > TITLE_MAX) return setError(`Title must be ${TITLE_MAX} characters or fewer.`)
        if (!dirty) return undefined
        setError(null)
        mutate(trimmed)
    }

    return (
        <Card as="form" className={styles.card} onSubmit={handleSubmit} noValidate>
            <div className={styles.header}>
                <Heading level={3}>Stream title</Heading>
                <Text tone="muted">Used for your next broadcasts. Changing it while live renames the current stream.</Text>
            </div>
            {saved && <Alert variant="success">Title saved.</Alert>}
            {disabled && (
                <Alert variant="info">
                    Generate a stream key first to set a title.{' '}
                    <Link to={paths.dashboard.settings} className={styles.link}>Go to stream settings</Link>
                </Alert>
            )}
            <FormField
                label="Title"
                required
                disabled={disabled}
                placeholder="What are you streaming today?"
                maxLength={TITLE_MAX}
                value={title}
                onChange={(event) => {
                    setTitle(event.target.value)
                    setError(null)
                    setSaved(false)
                }}
                error={error}
                hint={disabled ? undefined : `${trimmed.length}/${TITLE_MAX}`}
            />
            <div className={styles.actions}>
                <Button type="submit" loading={isPending} disabled={disabled || !dirty}>
                    Save title
                </Button>
            </div>
        </Card>
    )
}

/** Stream manager: live status, stream title, stream key. Going live/ending happens in the encoder. */
export function GoLivePanel() {
    const settingsQuery = useStreamSettings()
    const liveQuery = useMyLiveStream()
    const stream = liveQuery.data

    return (
        <div className={styles.layout}>
            {!liveQuery.isError && <StreamStats stream={stream} loading={liveQuery.isPending} />}

            {liveQuery.isPending && <Skeleton style={{ aspectRatio: '16 / 9', width: '100%' }} />}
            {liveQuery.isError && (
                <Alert>
                    {getErrorMessage(liveQuery.error, 'Couldn’t check whether you’re live.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => liveQuery.refetch()}>Try again</Button>
                </Alert>
            )}
            {liveQuery.isSuccess && (stream ? <LiveStatus stream={stream} /> : <OfflineStatus hasKey={Boolean(settingsQuery.data)} />)}

            {settingsQuery.isPending ? (
                <Card className={styles.card}><Skeleton style={{ height: '3.6rem' }} /></Card>
            ) : (
                // Remount when settings appear (first key) so the field picks up the default title
                <StreamTitleForm key={settingsQuery.data?.id ?? 'none'} settings={settingsQuery.data} />
            )}
        </div>
    )
}
