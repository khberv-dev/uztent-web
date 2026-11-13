import { NavLink } from 'react-router'
import { Badge, Icon, Text } from '@/components/atoms'
import { useMyLiveStream } from '@/features/streams'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import styles from './DashboardNav.module.css'

const ITEMS = [
    { to: paths.dashboard.home, icon: 'broadcast', label: 'Stream manager', end: true },
    { to: paths.dashboard.videos, icon: 'video', label: 'Videos' },
    { to: paths.dashboard.settings, icon: 'settings', label: 'Stream settings' },
]

/** Creator dashboard navigation. A side rail on desktop, a tab bar on phones. */
export function DashboardNav() {
    const { data: liveStream } = useMyLiveStream()

    return (
        <nav className={styles.nav} aria-label="Creator dashboard">
            <Text as="h2" size="sm" weight="bold" className={styles.heading}>Creator dashboard</Text>
            <ul className={styles.list}>
                {ITEMS.map((item) => (
                    <li key={item.to}>
                        <NavLink to={item.to} end={item.end} className={({ isActive }) => cn(styles.link, isActive && styles.active)}>
                            <Icon name={item.icon} size={18} />
                            <span className={styles.label}>{item.label}</span>
                            {item.to === paths.dashboard.home && liveStream && <Badge variant="live" className={styles.badge}>Live</Badge>}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
