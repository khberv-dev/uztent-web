import { useEffect, useId, useRef } from 'react'
import { Heading, IconButton } from '@/components/atoms'
import { cn } from '@/lib/cn'
import styles from './Modal.module.css'

/**
 * Modal dialog on the native <dialog> (focus trap, Escape and top layer come from the browser).
 * Closes on Escape, the close button, or a click on the backdrop.
 * @param {{open: boolean, onClose: () => void, title: string, children: React.ReactNode, className?: string}} props
 */
export function Modal({ open, onClose, title, children, className }) {
    const dialogRef = useRef(null)
    const titleId = useId()

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    return (
        <dialog
            ref={dialogRef}
            className={cn(styles.dialog, className)}
            aria-labelledby={titleId}
            onClose={onClose}
            // The dialog box fills its padding box, so a click whose target is the <dialog> itself hit the backdrop
            onClick={(event) => event.target === event.currentTarget && onClose()}
        >
            {open && (
                <div className={styles.content}>
                    <header className={styles.header}>
                        <Heading level={3} id={titleId}>{title}</Heading>
                        <IconButton icon="close" label="Yopish" onClick={onClose} />
                    </header>
                    <div className={styles.body}>{children}</div>
                </div>
            )}
        </dialog>
    )
}
