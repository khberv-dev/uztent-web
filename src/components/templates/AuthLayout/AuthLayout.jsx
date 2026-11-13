import { Outlet } from 'react-router'
import styles from './AuthLayout.module.css'

/** Centered, full-screen layout for sign-in flows. */
export function AuthLayout() {
    return (
        <div className={styles.layout}>
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    )
}
