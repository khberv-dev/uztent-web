import { useState } from 'react'
import { IconButton } from '@/components/atoms'
import { FormField } from '../FormField'

/** FormField for passwords with a show/hide toggle. Props are forwarded to FormField. */
export function PasswordField(props) {
    const [visible, setVisible] = useState(false)

    return (
        <FormField
            {...props}
            type={visible ? 'text' : 'password'}
            rightSlot={
                <IconButton
                    icon={visible ? 'eyeOff' : 'eye'}
                    label={visible ? 'Hide password' : 'Show password'}
                    size="sm"
                    onClick={() => setVisible((value) => !value)}
                />
            }
        />
    )
}
