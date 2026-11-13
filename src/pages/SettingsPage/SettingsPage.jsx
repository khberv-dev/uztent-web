import { getErrorMessage } from '@/api/errors'
import { Button, Card, Heading, Skeleton } from '@/components/atoms'
import { Alert } from '@/components/molecules'
import { PasswordForm, ProfileForm } from '@/components/organisms'
import { useMe } from '@/features/users'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
    const { data: user, isPending, isError, error, refetch } = useMe()

    return (
        <div className={styles.page}>
            <Heading level={1}>Settings</Heading>

            {isPending && (
                <Card>
                    <Skeleton style={{ height: '2rem', width: '30%' }} />
                    <Skeleton style={{ height: '3.6rem', marginTop: '2.4rem' }} />
                    <Skeleton style={{ height: '3.6rem', marginTop: '1.6rem' }} />
                </Card>
            )}

            {isError && (
                <Alert>
                    {getErrorMessage(error, 'Couldn’t load your profile.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>Try again</Button>
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
                </>
            )}
        </div>
    )
}
