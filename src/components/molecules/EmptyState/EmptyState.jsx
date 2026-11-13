import { Heading, Icon, Text } from '@/components/atoms'
import styles from './EmptyState.module.css'

/** @param {{icon?: string, title: string, description?: React.ReactNode, action?: React.ReactNode}} props */
export function EmptyState({ icon = 'video', title, description, action }) {
    return (
        <div className={styles.empty}>
            <span className={styles.icon}><Icon name={icon} size={28} /></span>
            <Heading level={3}>{title}</Heading>
            {description && <Text tone="muted">{description}</Text>}
            {action}
        </div>
    )
}
