import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getErrorMessage } from '@/api/errors'
import { Button, Icon, IconButton, Skeleton, Spinner, Text } from '@/components/atoms'
import { ChatMessage, Modal } from '@/components/molecules'
import {
    flattenChat,
    useAddModerator,
    useBanInChat,
    useChatHistory,
    useChatPermissions,
    useChatRoom,
    useDeleteChatMessage,
    useModerators,
    useRemoveModerator,
} from '@/features/chat'
import { useMe } from '@/features/users'
import { cn } from '@/lib/cn'
import { useIsAuthenticated } from '@/lib/session'
import { paths } from '@/routes/paths'
import { ChatModerationSettings } from '../ChatModerationSettings'
import { ChatComposer } from './ChatComposer'
import styles from './ChatPanel.module.css'

const BOTTOM_THRESHOLD = 40 // px from the bottom that still counts as "following" the chat

/**
 * Stream chat (Twitch style). Anyone can read; signed-in users can write while the stream is live;
 * the streamer and moderators can delete messages and ban, and the streamer can appoint moderators.
 * For a VOD (`live={false}`) it shows the stored chat as a read-only replay.
 * @param {{streamId: string, ownerId: string, live: boolean, slowModeSeconds?: number, className?: string}} props
 */
export function ChatPanel({ streamId, ownerId, live, slowModeSeconds = 0, className }) {
    const location = useLocation()
    const authenticated = useIsAuthenticated()
    const { data: me } = useMe()
    useChatRoom(streamId)

    const history = useChatHistory(streamId)
    const messages = useMemo(() => flattenChat(history.data), [history.data])
    const permissions = useChatPermissions(streamId)
    const role = permissions.data?.role
    const canModerate = Boolean(permissions.data?.canModerate)
    const isStreamer = role === 'streamer'

    const moderators = useModerators({ enabled: isStreamer })
    const moderatorIds = useMemo(() => new Set(moderators.data?.map((m) => m.userId)), [moderators.data])

    const [settingsOpen, setSettingsOpen] = useState(false)
    const [notice, setNotice] = useState(null) // {tone: 'muted' | 'error', text}
    const [armedBan, setArmedBan] = useState(null) // message id waiting for ban confirmation
    const onActionError = (fallback) => (err) => setNotice({ tone: 'error', text: getErrorMessage(err, fallback) })

    const remove = useDeleteChatMessage(streamId, { onError: onActionError('Couldn’t delete the message.') })
    const ban = useBanInChat(streamId, {
        onSuccess: (_, userId) => {
            const name = messages.findLast((m) => m.userId === userId)?.senderName ?? 'The user'
            setNotice({ tone: 'muted', text: `${name} is banned from this channel’s chat.` })
            setArmedBan(null)
        },
        onError: onActionError('Couldn’t ban the user.'),
    })
    const addModerator = useAddModerator({ onError: onActionError('Couldn’t add the moderator.') })
    const removeModerator = useRemoveModerator({ onError: onActionError('Couldn’t remove the moderator.') })

    /* ---------------------------- scrolling ---------------------------- */
    // Follow new messages while the viewer is at the bottom; when they scroll up to read, stay put
    // and offer a "new messages" button instead.
    const listRef = useRef(null)
    const followingRef = useRef(true)
    const restoreFromBottomRef = useRef(null) // keeps the position when older messages are prepended
    const [pausedAtId, setPausedAtId] = useState(null) // last message id when the viewer scrolled up
    const lastId = messages.at(-1)?.id ?? null
    const hasUnseen = pausedAtId !== null && lastId !== pausedAtId

    useLayoutEffect(() => {
        const list = listRef.current
        if (!list) return
        if (restoreFromBottomRef.current !== null) {
            list.scrollTop = list.scrollHeight - restoreFromBottomRef.current
            restoreFromBottomRef.current = null
        } else if (followingRef.current) {
            list.scrollTop = list.scrollHeight
        }
    }, [messages])

    function handleScroll() {
        const list = listRef.current
        const following = list.scrollHeight - list.scrollTop - list.clientHeight < BOTTOM_THRESHOLD
        followingRef.current = following
        if (following && pausedAtId !== null) setPausedAtId(null)
        else if (!following && pausedAtId === null) setPausedAtId(lastId)
    }

    function jumpToLatest() {
        const list = listRef.current
        followingRef.current = true
        setPausedAtId(null)
        list.scrollTop = list.scrollHeight
    }

    function loadOlder() {
        const list = listRef.current
        restoreFromBottomRef.current = list.scrollHeight - list.scrollTop
        history.fetchNextPage()
    }

    /* ---------------------------- moderation ---------------------------- */
    // The API enforces the same rules: nobody acts on the streamer, and only the streamer acts on moderators
    const canActOn = (message) =>
        canModerate &&
        message.userId !== me?.id &&
        message.userId !== ownerId &&
        (isStreamer || (message.senderRole !== 'moderator'))

    /** Items for the message's "⋯" menu. */
    function actionsFor(message) {
        if (!canActOn(message)) return []
        const name = message.senderName
        const items = [
            { icon: 'trash', label: 'Delete message', onSelect: () => remove.mutate(message.id) },
            { icon: 'ban', label: `Ban ${name}`, danger: true, onSelect: () => setArmedBan(message.id) },
        ]
        if (isStreamer) {
            const isModerator = moderatorIds.has(message.userId)
            items.push({
                icon: 'shield',
                label: isModerator ? 'Remove moderator' : 'Make moderator',
                onSelect: () => {
                    const mutation = isModerator ? removeModerator : addModerator
                    mutation.mutate(message.userId, {
                        onSuccess: () =>
                            setNotice({ tone: 'muted', text: isModerator ? `${name} is no longer a moderator.` : `${name} is now a moderator.` }),
                    })
                },
            })
        }
        return items
    }

    /** Ban is the one action that asks first: confirm under the message. */
    function banConfirmation(message) {
        if (armedBan !== message.id) return null
        return (
            <>
                <Text size="sm" tone="muted">Ban {message.senderName} from this channel’s chat?</Text>
                <Button size="sm" variant="ghost" onClick={() => setArmedBan(null)}>Cancel</Button>
                <Button size="sm" variant="danger" autoFocus loading={ban.isPending} onClick={() => ban.mutate(message.userId)}>
                    Ban
                </Button>
            </>
        )
    }

    /* ---------------------------- footer ---------------------------- */
    let footer
    if (!live) {
        footer = <Text size="sm" tone="muted" className={styles.footerNote}>Chat replay. The stream has ended.</Text>
    } else if (!authenticated) {
        footer = (
            <Button as={Link} to={paths.auth} state={{ from: location.pathname }} fullWidth>
                Log in to chat
            </Button>
        )
    } else if (permissions.isPending) {
        footer = <Skeleton style={{ height: '3.6rem' }} />
    } else if (permissions.data?.banned) {
        footer = (
            <Text size="sm" tone="muted" className={styles.footerNote}>
                <Icon name="ban" size={14} /> You’re banned from this channel’s chat.
            </Text>
        )
    } else {
        footer = (
            <ChatComposer
                streamId={streamId}
                slowModeSeconds={slowModeSeconds}
                exempt={canModerate}
                onForbidden={() => permissions.refetch()}
            />
        )
    }

    return (
        <section className={cn(styles.panel, className)} aria-label={live ? 'Stream chat' : 'Chat replay'}>
            <header className={styles.header}>
                <Text as="h2" size="sm" weight="bold" className={styles.title}>
                    {live ? 'Stream chat' : 'Chat replay'}
                </Text>
                <div className={styles.headerEnd}>
                    {live && slowModeSeconds > 0 && (
                        <span className={styles.slowMode} title={`Viewers can send one message every ${slowModeSeconds} s`}>
                            <Icon name="clock" size={12} /> Slow {slowModeSeconds} s
                        </span>
                    )}
                    {isStreamer && (
                        <IconButton icon="settings" size="sm" label="Chat settings" onClick={() => setSettingsOpen(true)} />
                    )}
                </div>
            </header>

            {isStreamer && (
                <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Chat settings">
                    <ChatModerationSettings embedded />
                </Modal>
            )}

            <div className={styles.listWrap}>
                <div ref={listRef} className={styles.list} onScroll={handleScroll} role="log" aria-live="polite">
                    {history.hasNextPage && (
                        <div className={styles.older}>
                            <Button size="sm" variant="ghost" loading={history.isFetchingNextPage} onClick={loadOlder}>
                                Load older messages
                            </Button>
                        </div>
                    )}

                    {history.isPending && <div className={styles.center}><Spinner /></div>}
                    {history.isError && !history.data && (
                        <div className={styles.center}>
                            <Text size="sm" tone="muted">{getErrorMessage(history.error, 'Couldn’t load the chat.')}</Text>
                            <Button size="sm" variant="ghost" onClick={() => history.refetch()}>Try again</Button>
                        </div>
                    )}
                    {history.isSuccess && messages.length === 0 && (
                        <div className={styles.center}>
                            <Icon name="message" size={24} />
                            <Text size="sm" tone="muted">
                                {live ? 'Welcome to the chat! Say hi.' : 'Nobody chatted during this stream.'}
                            </Text>
                        </div>
                    )}

                    {messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            own={message.userId === me?.id}
                            actions={actionsFor(message)}
                        >
                            {banConfirmation(message)}
                        </ChatMessage>
                    ))}
                </div>

                {hasUnseen && (
                    <button type="button" className={styles.jump} onClick={jumpToLatest}>
                        <Icon name="arrowDown" size={14} /> New messages
                    </button>
                )}
            </div>

            <footer className={styles.footer}>
                {notice && (
                    <div className={cn(styles.notice, notice.tone === 'error' && styles.error)} role="status">
                        <span>{notice.text}</span>
                        <IconButton icon="close" size="sm" label="Dismiss" onClick={() => setNotice(null)} />
                    </div>
                )}
                {footer}
            </footer>
        </section>
    )
}
