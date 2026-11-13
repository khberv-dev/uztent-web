import { Link, useLocation, useNavigate } from 'react-router'
import { Badge, Button, IconButton, Logo, Skeleton } from '@/components/atoms'
import { SearchBar, UserMenu } from '@/components/molecules'
import { displayName, useSignOut } from '@/features/auth'
import { env } from '@/config/env'
import { useMyLiveStream } from '@/features/streams'
import { useMe } from '@/features/users'
import { useIsAuthenticated } from '@/lib/session'
import { paths } from '@/routes/paths'
import styles from './Navbar.module.css'

export function Navbar({ onToggleSidebar }) {
    const navigate = useNavigate()
    const location = useLocation()
    const authenticated = useIsAuthenticated()
    const { data: user } = useMe()
    const { data: myStream } = useMyLiveStream()
    const signOut = useSignOut()

    return (
        <header className={styles.navbar}>
            <div className={styles.left}>
                {onToggleSidebar && (
                    <IconButton icon="menu" label="Yon panel" onClick={onToggleSidebar} className={styles.menuButton} />
                )}
                <Link to={paths.home} aria-label="Bosh sahifa" className={styles.brand}>
                    <Logo />
                    {/* VITE_SHOW_BETA_BADGE */}
                    {env.showBetaBadge && <Badge variant="beta">Beta</Badge>}
                </Link>
            </div>

            <div className={styles.center}>
                <SearchBar />
            </div>

            <div className={styles.right}>
                {!authenticated ? (
                    // Live pages are public; signing in comes back to the current page
                    <Button as={Link} to={paths.auth} state={{ from: location.pathname }}>
                        Kirish
                    </Button>
                ) : (
                    <>
                    {myStream && (
                        <Link to={paths.dashboard.home} className={styles.liveLink} title="Streamni boshqarish">
                            <Badge variant="live">Live</Badge>
                        </Link>
                    )}
                    <IconButton icon="bell" label="Bildirishnomalar" />
                    {user ? (
                        <UserMenu
                            name={displayName(user)}
                            email={user.email}
                            items={[
                                { icon: 'broadcast', label: 'Streamer paneli', onSelect: () => navigate(paths.dashboard.home) },
                                { icon: 'video', label: 'Videolarim', onSelect: () => navigate(paths.dashboard.videos) },
                                { icon: 'wallet', label: 'Daromad', onSelect: () => navigate(paths.dashboard.earnings) },
                                { icon: 'settings', label: 'Akkaunt sozlamalari', onSelect: () => navigate(paths.settings) },
                            ]}
                            onSignOut={signOut}
                        />
                    ) : (
                        <Skeleton circle style={{ width: '3rem', height: '3rem' }} />
                    )}
                    </>
                )}
            </div>
        </header>
    )
}
