import { useState } from 'react'
import { getErrorMessage, getErrorStatus } from '@/api/errors'
import { IconButton, Input, Text } from '@/components/atoms'
import { useSendChatMessage } from '@/features/chat'
import { useNow } from '@/hooks/useNow'
import styles from './ChatPanel.module.css'

const MAX_LENGTH = 500

/**
 * Message input. Keeps the text when sending fails (429 rate limit / slow mode, 403 banned,
 * 404 stream ended) and counts down slow mode for viewers.
 * @param {{streamId: string, slowModeSeconds: number, exempt: boolean, onForbidden: () => void}} props
 */
export function ChatComposer({ streamId, slowModeSeconds, exempt, onForbidden }) {
    const [text, setText] = useState('')
    const [error, setError] = useState(null)
    const [cooldownUntil, setCooldownUntil] = useState(0)
    const now = useNow()
    const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

    const send = useSendChatMessage(streamId, {
        onSuccess: () => {
            setText('')
            setError(null)
            if (!exempt && slowModeSeconds > 0) setCooldownUntil(Date.now() + slowModeSeconds * 1000)
        },
        onError: (err) => {
            const status = getErrorStatus(err)
            if (status === 404) return setError('Stream tugadi, chat yopildi.')
            setError(getErrorMessage(err, 'Xabar yuborilmadi. Qayta urinib koʻring.'))
            if (status === 429) {
                // "Slow mode is on: wait 25 s before your next message"
                const wait = Number(String(err.response?.data?.message ?? '').match(/wait (\d+) s/)?.[1])
                if (wait > 0) setCooldownUntil(Date.now() + wait * 1000)
            }
            if (status === 403) onForbidden()
            return undefined
        },
    })

    const trimmed = text.trim()

    function handleSubmit(event) {
        event.preventDefault()
        if (!trimmed || remaining > 0 || send.isPending) return
        send.mutate(trimmed)
    }

    let hint = null
    if (remaining > 0) hint = `Slow mode: ${remaining} s dan keyin yana yoza olasiz`
    else if (slowModeSeconds > 0 && !exempt) hint = `Slow mode: har ${slowModeSeconds} s da bitta xabar`
    else if (text.length > MAX_LENGTH - 50) hint = `${text.length}/${MAX_LENGTH}`

    return (
        <form className={styles.composer} onSubmit={handleSubmit}>
            <Input
                aria-label="Xabar yozish"
                placeholder="Xabar yozing"
                maxLength={MAX_LENGTH}
                value={text}
                invalid={Boolean(error)}
                autoComplete="off"
                onChange={(event) => {
                    setText(event.target.value)
                    if (error) setError(null)
                }}
                rightSlot={
                    <IconButton
                        type="submit"
                        icon="send"
                        size="sm"
                        label="Yuborish"
                        disabled={!trimmed || remaining > 0 || send.isPending}
                    />
                }
            />
            {error ? (
                <Text size="sm" tone="danger" role="alert">{error}</Text>
            ) : (
                hint && <Text size="sm" tone="muted">{hint}</Text>
            )}
        </form>
    )
}
