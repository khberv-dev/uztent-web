import { useState } from 'react'
import { Link } from 'react-router'
import { getErrorMessage, getErrorStatus } from '@/api/errors'
import { Avatar, Button, Card, Heading, Skeleton, Text } from '@/components/atoms'
import { Alert } from '@/components/molecules'
import { useAddModerator, useChatBans, useModerators, useRemoveModerator, useUnbanUser } from '@/features/chat'
import { useStreamSettings, useUpdateChatSlowMode } from '@/features/streams'
import { cn } from '@/lib/cn'
import { formatTimeAgo } from '@/lib/format'
import { paths } from '@/routes/paths'
import styles from './ChatModerationSettings.module.css'

const SLOW_MODE_OPTIONS = [0, 3, 5, 10, 30, 60, 120, 300]
const slowModeLabel = (seconds) => (seconds === 0 ? 'Oʻchiq' : seconds < 60 ? `${seconds} s` : `${seconds / 60} daq`)
const channelUserName = (user) => user.username ?? (`${user.firstName} ${user.lastName}`.trim() || 'Foydalanuvchi')

function SlowModeCard() {
    const { data: settings, isPending } = useStreamSettings()
    const update = useUpdateChatSlowMode()
    const current = settings?.chatSlowModeSeconds ?? 0
    const options = SLOW_MODE_OPTIONS.includes(current) ? SLOW_MODE_OPTIONS : [...SLOW_MODE_OPTIONS, current].sort((a, b) => a - b)
    const pendingValue = update.isPending ? update.variables : null

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Heading level={3}>Slow mode</Heading>
                <Text tone="muted">Tomoshabinlar xabarlar orasida qancha kutishi kerakligi. Siz va moderatorlaringiz cheklanmaysiz. Oʻzgarishlar darhol kuchga kiradi.</Text>
            </div>
            {isPending ? (
                <Skeleton style={{ height: '3.2rem' }} />
            ) : !settings ? (
                <Alert variant="info">
                    Chatni sozlash uchun avval stream key yarating.{' '}
                    <Link to={paths.dashboard.settings} className={styles.link}>Stream sozlamalariga oʻtish</Link>
                </Alert>
            ) : (
                <div className={styles.options} role="radiogroup" aria-label="Slow mode">
                    {options.map((seconds) => (
                        <button
                            key={seconds}
                            type="button"
                            role="radio"
                            aria-checked={(pendingValue ?? current) === seconds}
                            className={cn(styles.option, (pendingValue ?? current) === seconds && styles.selected)}
                            disabled={update.isPending}
                            onClick={() => seconds !== current && update.mutate(seconds)}
                        >
                            {slowModeLabel(seconds)}
                        </button>
                    ))}
                </div>
            )}
            {update.isError && (
                <Alert>
                    {getErrorStatus(update.error) === 404
                        ? 'Avval stream sozlamalarida stream key yarating.'
                        : getErrorMessage(update.error, 'Slow mode’ni oʻzgartirib boʻlmadi.')}
                </Alert>
            )}
        </Card>
    )
}

function UserList({ query, emptyText, renderActions }) {
    if (query.isPending) {
        return [0, 1].map((i) => <Skeleton key={i} style={{ height: '4.4rem' }} />)
    }
    if (query.isError) {
        return (
            <Alert>
                {getErrorMessage(query.error, 'Roʻyxatni yuklab boʻlmadi.')}{' '}
                <Button variant="ghost" size="sm" onClick={() => query.refetch()}>Qayta urinish</Button>
            </Alert>
        )
    }
    if (query.data.length === 0) return <Text tone="muted" size="sm">{emptyText}</Text>

    return (
        <ul className={styles.list}>
            {query.data.map((user) => (
                <li key={user.userId} className={styles.row}>
                    <Avatar name={channelUserName(user)} size="sm" />
                    <div className={styles.rowText}>
                        <Text weight="semibold" truncate>{channelUserName(user)}</Text>
                        <Text size="sm" tone="muted">{formatTimeAgo(user.since)}</Text>
                    </div>
                    <div className={styles.rowActions}>{renderActions(user)}</div>
                </li>
            ))}
        </ul>
    )
}

function ModeratorsCard() {
    const moderators = useModerators()
    const [error, setError] = useState(null)
    const remove = useRemoveModerator({ onError: (err) => setError(getErrorMessage(err, 'Moderatorni olib tashlab boʻlmadi.')) })

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Heading level={3}>Moderatorlar</Heading>
                <Text tone="muted">Moderatorlar barcha chatlaringizda (live’da ham, yozuvlarda ham) xabarlarni oʻchira oladi va tomoshabinlarni ban qila oladi.</Text>
            </div>
            {error && <Alert>{error}</Alert>}
            <UserList
                query={moderators}
                emptyText="Hali moderatorlar yoʻq. Qoʻshish uchun chatdagi xabarning ⋯ menyusini oching va “Moderator qilish”ni tanlang."
                renderActions={(user) => (
                    <Button
                        size="sm"
                        variant="secondary"
                        loading={remove.isPending && remove.variables === user.userId}
                        onClick={() => {
                            setError(null)
                            remove.mutate(user.userId)
                        }}
                    >
                        Olib tashlash
                    </Button>
                )}
            />
        </Card>
    )
}

function BansCard() {
    const bans = useChatBans()
    const [error, setError] = useState(null)
    const onError = (fallback) => (err) => setError(getErrorMessage(err, fallback))
    const unban = useUnbanUser({ onError: onError('Foydalanuvchini unban qilib boʻlmadi.') })
    const promote = useAddModerator({ onError: onError('Moderator qoʻshib boʻlmadi.') })

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Heading level={3}>Ban qilinganlar</Heading>
                <Text tone="muted">Ban qilinganlar chatni oʻqiy oladi, lekin streamlaringizning hech birida yoza olmaydi.</Text>
            </div>
            {error && <Alert>{error}</Alert>}
            <UserList
                query={bans}
                emptyText="Hech kim ban qilinmagan."
                renderActions={(user) => (
                    <>
                        <Button
                            size="sm"
                            variant="ghost"
                            loading={promote.isPending && promote.variables === user.userId}
                            title="Banni olib tashlaydi va moderator qiladi"
                            onClick={() => {
                                setError(null)
                                promote.mutate(user.userId)
                            }}
                        >
                            Moderator qilish
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            loading={unban.isPending && unban.variables === user.userId}
                            onClick={() => {
                                setError(null)
                                unban.mutate(user.userId)
                            }}
                        >
                            Unban
                        </Button>
                    </>
                )}
            />
        </Card>
    )
}

/**
 * Chat settings for the streamer's channel: slow mode, moderators, bans.
 * `embedded` drops the card surfaces (for use inside a modal).
 */
export function ChatModerationSettings({ embedded = false }) {
    return (
        <div className={cn(styles.layout, embedded && styles.embedded)}>
            <SlowModeCard />
            <ModeratorsCard />
            <BansCard />
        </div>
    )
}
