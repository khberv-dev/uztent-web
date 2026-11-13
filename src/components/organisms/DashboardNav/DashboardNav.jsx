import { NavLink } from 'react-router'
import { Badge, Icon, Text } from '@/components/atoms'
import { useMyLiveStream } from '@/features/streams'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import styles from './DashboardNav.module.css'

const ITEMS = [
    { to: paths.dashboard.home, icon: 'broadcast', label: 'Stream boshqaruvi', short: 'Boshqaruv', end: true },
    { to: paths.dashboard.videos, icon: 'video', label: 'Videolar', short: 'Videolar' },
    { to: paths.dashboard.earnings, icon: 'wallet', label: 'Daromad', short: 'Daromad' },
    { to: paths.dashboard.settings, icon: 'settings', label: 'Stream sozlamalari', short: 'Sozlamalar' },
]

/** Creator dashboard navigation. A side rail on desktop, a tab bar on phones. */
export function DashboardNav() {
    const { data: liveStream } = useMyLiveStream()

    return (
        <nav className={styles.nav} aria-label="Streamer paneli">
            <Text as="h2" size="sm" weight="bold" className={styles.heading}>Streamer paneli</Text>
            <ul className={styles.list}>
                {ITEMS.map((item) => (
                    <li key={item.to}>
                        <NavLink aria-label={item.label} to={item.to} end={item.end} className={({ isActive }) => cn(styles.link, isActive && styles.active)}>
                            <Icon name={item.icon} size={18} />
                            <span className={styles.label}>{item.label}</span>
                            <span className={styles.short} aria-hidden="true">{item.short}</span>
                            {item.to === paths.dashboard.home && liveStream && <Badge variant="live" className={styles.badge}>Live</Badge>}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
