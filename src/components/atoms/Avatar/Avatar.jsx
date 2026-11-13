import { useState } from 'react'
import { cn } from '@/lib/cn'
import styles from './Avatar.module.css'

function initialsOf(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || '?'
}

/**
 * Round avatar with initials fallback. `live` adds a red ring like on Twitch.
 * @param {{src?: string | null, name?: string, size?: 'xs' | 'sm' | 'md' | 'lg', live?: boolean, className?: string}} props
 */
export function Avatar({ src, name = '', size = 'md', live = false, className }) {
    const [failedSrc, setFailedSrc] = useState(null)
    const showImage = src && failedSrc !== src

    return (
        <span className={cn(styles.avatar, styles[size], live && styles.live, className)}>
            {showImage ? (
                <img src={src} alt={name} className={styles.image} onError={() => setFailedSrc(src)} />
            ) : (
                <span className={styles.initials} aria-label={name}>{initialsOf(name)}</span>
            )}
        </span>
    )
}
