import { Outlet } from 'react-router'
import { DashboardNav, Navbar } from '@/components/organisms'
import styles from './DashboardLayout.module.css'

/** Creator (publisher) shell: the app navbar plus dashboard navigation instead of the live-channels sidebar. */
export function DashboardLayout() {
    return (
        <div className={styles.layout}>
            <Navbar />
            <div className={styles.body}>
                <DashboardNav />
                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
