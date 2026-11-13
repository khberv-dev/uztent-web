import { useState } from 'react'
import { Outlet } from 'react-router'
import { Navbar, Sidebar } from '@/components/organisms'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import styles from './MainLayout.module.css'

/** App shell: sticky top navbar, collapsible left sidebar, scrolling main content. */
export function MainLayout() {
    const [collapsedByUser, setCollapsedByUser] = useState(false)
    const isNarrow = useMediaQuery('(max-width: 1100px)')
    const collapsed = isNarrow || collapsedByUser

    const toggleSidebar = isNarrow ? undefined : () => setCollapsedByUser((value) => !value)

    return (
        <div className={styles.layout}>
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className={styles.body}>
                <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
