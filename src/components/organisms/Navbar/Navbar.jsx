import { Link, useLocation, useNavigate } from 'react-router'
import { Badge, Button, IconButton, Logo, Skeleton } from '@/components/atoms'
import { SearchBar, UserMenu } from '@/components/molecules'
import { displayName, useSignOut } from '@/features/auth'
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
                    <IconButton icon="menu" label="Toggle sidebar" onClick={onToggleSidebar} className={styles.menuButton} />
                )}
                <Link to={paths.home} aria-label="Home">
                    <Logo />
                </Link>
            </div>

            <div className={styles.center}>
                <SearchBar />
            </div>

            <div className={styles.right}>
                {!authenticated ? (
                    // Live pages are public; signing in comes back to the current page
                    <Button as={Link} to={paths.auth} state={{ from: location.pathname }}>
                        Log in
                    </Button>
                ) : (
                    <>
                    {myStream && (
                        <Link to={paths.dashboard.home} className={styles.liveLink} title="Manage your stream">
                            <Badge variant="live">Live</Badge>
                        </Link>
                    )}
                    <IconButton icon="bell" label="Notifications" />
                    {user ? (
                        <UserMenu
                            name={displayName(user)}
                            email={user.email}
                            items={[
                                { icon: 'broadcast', label: 'Creator dashboard', onSelect: () => navigate(paths.dashboard.home) },
                                { icon: 'video', label: 'My videos', onSelect: () => navigate(paths.dashboard.videos) },
                                { icon: 'settings', label: 'Account settings', onSelect: () => navigate(paths.settings) },
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
