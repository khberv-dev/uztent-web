import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { getErrorMessage } from '@/api/errors'
import { Button, Card, Heading, Skeleton } from '@/components/atoms'
import { Alert } from '@/components/molecules'
import { PasswordForm, ProfileForm, SavedCards } from '@/components/organisms'
import { useMe } from '@/features/users'
import { paths } from '@/routes/paths'
import styles from './SettingsPage.module.css'

/** Account settings. /settings/cards is the same page, scrolled to the cards with the add-card form open. */
export function SettingsPage() {
    const { data: user, isPending, isError, error, refetch } = useMe()
    const location = useLocation()
    const cardsRef = useRef(null)
    const onCardsPage = location.pathname === paths.settingsCards

    useEffect(() => {
        if (onCardsPage && user) cardsRef.current?.scrollIntoView({ block: 'start' })
    }, [onCardsPage, user])

    return (
        <div className={styles.page}>
            <Heading level={1}>Sozlamalar</Heading>

            {isPending && (
                <Card>
                    <Skeleton style={{ height: '2rem', width: '30%' }} />
                    <Skeleton style={{ height: '3.6rem', marginTop: '2.4rem' }} />
                    <Skeleton style={{ height: '3.6rem', marginTop: '1.6rem' }} />
                </Card>
            )}

            {isError && (
                <Alert>
                    {getErrorMessage(error, 'Profilni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                </Alert>
            )}

            {user && (
                <>
                    <Card>
                        <ProfileForm user={user} />
                    </Card>
                    <Card>
                        {/* Remount when hasPassword flips so the form switches from "set" to "change" cleanly */}
                        <PasswordForm key={String(user.hasPassword)} user={user} />
                    </Card>
                    <Card ref={cardsRef} className={styles.cards}>
                        <SavedCards startAdding={onCardsPage} />
                    </Card>
                </>
            )}
        </div>
    )
}
