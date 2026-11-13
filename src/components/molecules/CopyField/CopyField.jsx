import { useEffect, useId, useState } from 'react'
import { IconButton, Input, Label, Text } from '@/components/atoms'
import styles from './CopyField.module.css'

/**
 * Read-only value with a copy button. `secret` hides the value until revealed (stream keys).
 * @param {{label: string, value: string, secret?: boolean, hint?: string}} props
 */
export function CopyField({ label, value, secret = false, hint }) {
    const id = useId()
    const [revealed, setRevealed] = useState(!secret)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return undefined
        const timer = setTimeout(() => setCopied(false), 1500)
        return () => clearTimeout(timer)
    }, [copied])

    async function copy() {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
        } catch {
            // Clipboard blocked (insecure context): select the text so the user can copy it
            document.getElementById(id)?.select()
        }
    }

    return (
        <div className={styles.field}>
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                readOnly
                type={revealed ? 'text' : 'password'}
                value={value}
                onFocus={(event) => event.target.select()}
                rightSlot={
                    <span className={styles.actions}>
                        {secret && (
                            <IconButton
                                icon={revealed ? 'eyeOff' : 'eye'}
                                label={revealed ? `Yashirish: ${label}` : `Koʻrsatish: ${label}`}
                                size="sm"
                                onClick={() => setRevealed((v) => !v)}
                            />
                        )}
                        <IconButton icon={copied ? 'check' : 'copy'} label={copied ? 'Nusxalandi' : `Nusxalash: ${label}`} size="sm" onClick={copy} />
                    </span>
                }
            />
            {hint && <Text size="sm" tone="muted">{hint}</Text>}
        </div>
    )
}
