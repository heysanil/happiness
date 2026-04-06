'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'paris/button';
import { Dialog } from 'paris/dialog';
import { Text } from 'paris/text';
import { pvar } from 'paris/theme';
import { useState } from 'react';

export function CancelSubscriptionButton({
    subscriptionId,
}: {
    subscriptionId: string;
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCancel = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/v1/portal/subscriptions/${subscriptionId}`,
                { method: 'DELETE' },
            );

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(
                    data?.error ?? 'Failed to cancel subscription.',
                );
            }

            setIsOpen(false);
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to cancel subscription.',
            );
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                kind="tertiary"
                size="xs"
                theme="negative"
                onClick={() => setIsOpen(true)}
            >
                Cancel
            </Button>
            <Dialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Cancel subscription"
                width="compact"
            >
                <div className="flex flex-col gap-5">
                    <Text
                        kind="paragraphSmall"
                        color={pvar('new.colors.contentSecondary')}
                    >
                        Are you sure you want to cancel this subscription? It
                        will remain active until the end of your current billing
                        period.
                    </Text>
                    {error && (
                        <Text
                            kind="paragraphSmall"
                            color={pvar('new.colors.contentNegative')}
                        >
                            {error}
                        </Text>
                    )}
                    <div className="flex flex-row justify-end gap-3">
                        <Button
                            kind="primary"
                            onClick={() => setIsOpen(false)}
                            disabled={loading}
                        >
                            Keep
                        </Button>
                        <Button
                            kind="secondary"
                            theme="negative"
                            onClick={handleCancel}
                            loading={loading}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    );
}
