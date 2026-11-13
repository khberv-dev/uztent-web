import { useId } from 'react'
import { Input, Label, Text } from '@/components/atoms'
import styles from './FormField.module.css'

/**
 * Label + Input + message, wired together with ids for accessibility.
 * Message priority: error > success > hint. Extra props go to the Input.
 * @param {{label: string, error?: string, success?: string, hint?: string, required?: boolean, id?: string} & React.ComponentProps<typeof Input>} props
 */
export function FormField({ label, error, success, hint, required, id, ...inputProps }) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const messageId = `${inputId}-message`
    const message = error || success || hint
    const tone = error ? 'danger' : success ? 'success' : 'muted'

    return (
        <div className={styles.field}>
            <Label htmlFor={inputId} required={required}>{label}</Label>
            <Input
                id={inputId}
                invalid={Boolean(error)}
                required={required}
                aria-describedby={message ? messageId : undefined}
                {...inputProps}
            />
            {message && (
                <Text id={messageId} size="sm" tone={tone} role={error ? 'alert' : success ? 'status' : undefined}>
                    {message}
                </Text>
            )}
        </div>
    )
}
