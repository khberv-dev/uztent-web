import { useState } from 'react'
import { getErrorMessage } from '@/api/errors'
import { Button, Card, Heading, Skeleton, Text } from '@/components/atoms'
import { Alert, ConfirmButton, CopyField } from '@/components/molecules'
import { useGenerateStreamKey, useStreamSettings } from '@/features/streams'
import { formatTimeAgo } from '@/lib/format'
import styles from './StreamKeyCard.module.css'

/**
 * Encoder settings: publish URL + stream key (GET /streams/me), with generate / reset (POST /streams/me/key).
 * Replacing the key affects new broadcasts only; a broadcast already running continues.
 */
export function StreamKeyCard() {
    const { data: settings, isPending, isError, error, refetch } = useStreamSettings()
    const [notice, setNotice] = useState(null)
    const hadKey = Boolean(settings)
    const generate = useGenerateStreamKey({
        onSuccess: () =>
            setNotice(
                hadKey
                    ? 'New key generated. Paste it into your encoder: the old key no longer works for new broadcasts.'
                    : 'Stream key generated. Paste the server and key into your encoder.',
            ),
    })

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Heading level={3}>Stream key</Heading>
                <Text tone="muted">Your encoder connects with these. The key stays the same between streams.</Text>
            </div>

            {isPending && (
                <>
                    <Skeleton style={{ height: '3.6rem' }} />
                    <Skeleton style={{ height: '3.6rem' }} />
                </>
            )}

            {isError && (
                <Alert>
                    {getErrorMessage(error, 'Couldn’t load your stream key.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>Try again</Button>
                </Alert>
            )}

            {notice && <Alert variant="success">{notice}</Alert>}
            {generate.isError && <Alert>{getErrorMessage(generate.error, 'Couldn’t generate a stream key.')}</Alert>}

            {settings === null && (
                <div className={styles.empty}>
                    <Text>You don’t have a stream key yet. Your encoder needs one to connect.</Text>
                    <Button loading={generate.isPending} onClick={() => generate.mutate()}>
                        Generate stream key
                    </Button>
                </div>
            )}

            {settings && (
                <>
                    <CopyField label="Server" value={settings.publishUrl} />
                    {/*
                      OBS needs encoderStreamKey ("<id>?key=<streamKey>"), not the raw streamKey.
                      key= resets the hidden/revealed state after the key changes.
                    */}
                    <CopyField
                        key={settings.encoderStreamKey}
                        label="Stream key"
                        value={settings.encoderStreamKey}
                        secret
                        hint="Never share your key: anyone with it can stream to your channel."
                    />
                    <div className={styles.footer}>
                        <Text size="sm" tone="muted">
                            {settings.updatedAt !== settings.createdAt ? 'Last reset' : 'Created'} {formatTimeAgo(settings.updatedAt)}
                        </Text>
                        <ConfirmButton
                            variant="secondary"
                            size="sm"
                            confirmLabel="Reset key"
                            loading={generate.isPending}
                            onConfirm={() => {
                                setNotice(null)
                                generate.mutate()
                            }}
                        >
                            Reset key
                        </ConfirmButton>
                    </div>
                </>
            )}
        </Card>
    )
}
