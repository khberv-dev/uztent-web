import { Link } from 'react-router'
import { Avatar, Skeleton, Text } from '@/components/atoms'
import styles from './VideoCard.module.css'

/**
 * Twitch-style card for live streams and VODs: 16:9 thumbnail with overlay badges,
 * then avatar / title / meta lines. Without `thumbnailUrl`, a gradient derived from `hue` is shown.
 *
 * @param {{
 *   to: string, title: string, avatarName?: string, lines?: React.ReactNode[],
 *   thumbnailUrl?: string | null, hue?: number,
 *   topLeft?: React.ReactNode, bottomLeft?: React.ReactNode, bottomRight?: React.ReactNode,
 *   actions?: React.ReactNode,
 * }} props
 */
export function VideoCard({ to, title, avatarName, lines = [], thumbnailUrl, hue = 220, topLeft, bottomLeft, bottomRight, actions }) {
    return (
        <article className={styles.card}>
            <Link to={to} className={styles.thumbnailLink} aria-label={title}>
                <div className={styles.thumbnail} style={thumbnailUrl ? undefined : { '--hue': hue }}>
                    {thumbnailUrl && <img src={thumbnailUrl} alt="" className={styles.image} loading="lazy" />}
                    {topLeft && <span className={styles.topLeft}>{topLeft}</span>}
                    {bottomLeft && <span className={styles.bottomLeft}>{bottomLeft}</span>}
                    {bottomRight && <span className={styles.bottomRight}>{bottomRight}</span>}
                </div>
            </Link>
            <div className={styles.meta}>
                {avatarName && <Avatar name={avatarName} size="md" />}
                <div className={styles.text}>
                    <Link to={to} className={styles.title} title={title}>{title}</Link>
                    {lines.filter(Boolean).map((line, index) => (
                        <Text key={index} size="md" tone="muted" truncate>{line}</Text>
                    ))}
                </div>
                {actions && <div className={styles.actions}>{actions}</div>}
            </div>
        </article>
    )
}

export function VideoCardSkeleton() {
    return (
        <div className={styles.card} aria-hidden="true">
            <Skeleton style={{ aspectRatio: '16 / 9', width: '100%' }} />
            <div className={styles.meta}>
                <Skeleton circle style={{ width: '4rem', height: '4rem', flexShrink: 0 }} />
                <div className={styles.text}>
                    <Skeleton style={{ height: '1.4rem', width: '80%' }} />
                    <Skeleton style={{ height: '1.2rem', width: '45%', marginTop: '0.6rem' }} />
                </div>
            </div>
        </div>
    )
}
