import { icons } from './icons'

/**
 * @param {{name: keyof typeof icons, size?: number, strokeWidth?: number, className?: string, title?: string}} props
 */
export function Icon({ name, size = 20, strokeWidth = 2, className, title }) {
    const content = icons[name]
    if (!content) return null

    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            role={title ? 'img' : undefined}
            aria-hidden={title ? undefined : true}
            aria-label={title}
        >
            {content}
        </svg>
    )
}
