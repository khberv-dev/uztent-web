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
                    ? 'Yangi key yaratildi. Uni encoder’ga qoʻying: eski key yangi streamlar uchun endi ishlamaydi.'
                    : 'Stream key yaratildi. Server va key’ni encoder’ga qoʻying.',
            ),
    })

    return (
        <Card className={styles.card}>
            <div className={styles.header}>
                <Heading level={3}>Stream key</Heading>
                <Text tone="muted">Encoder shular orqali ulanadi. Key streamlar orasida oʻzgarmaydi.</Text>
            </div>

            {isPending && (
                <>
                    <Skeleton style={{ height: '3.6rem' }} />
                    <Skeleton style={{ height: '3.6rem' }} />
                </>
            )}

            {isError && (
                <Alert>
                    {getErrorMessage(error, 'Stream key’ni yuklab boʻlmadi.')}{' '}
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
                </Alert>
            )}

            {notice && <Alert variant="success">{notice}</Alert>}
            {generate.isError && <Alert>{getErrorMessage(generate.error, 'Stream key yaratib boʻlmadi.')}</Alert>}

            {settings === null && (
                <div className={styles.empty}>
                    <Text>Sizda hali stream key yoʻq. Encoder ulanishi uchun u kerak.</Text>
                    <Button loading={generate.isPending} onClick={() => generate.mutate()}>
                        Stream key yaratish
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
                        hint="Key’ni hech kimga bermang: unga ega boʻlgan har kim kanalingizga stream qila oladi."
                    />
                    <div className={styles.footer}>
                        <Text size="sm" tone="muted">
                            {settings.updatedAt !== settings.createdAt ? 'Oxirgi yangilanish:' : 'Yaratilgan:'} {formatTimeAgo(settings.updatedAt)}
                        </Text>
                        <ConfirmButton
                            variant="secondary"
                            size="sm"
                            confirmLabel="Key’ni yangilash"
                            loading={generate.isPending}
                            onConfirm={() => {
                                setNotice(null)
                                generate.mutate()
                            }}
                        >
                            Key’ni yangilash
                        </ConfirmButton>
                    </div>
                </>
            )}
        </Card>
    )
}
