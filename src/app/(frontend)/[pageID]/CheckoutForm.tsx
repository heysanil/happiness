'use client';

import { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Button } from 'paris/button';
import { Text } from 'paris/text';
import { formatCurrency } from 'src/util/formatCurrency';
import type { DonationConfig } from '@v1/donations/checkout/DonationConfig';
import { estimateFee } from '@v1/donations/checkout/DonationConfig';

export const CheckoutForm = ({
    donation,
    onSuccess,
    returnUrl,
}: {
    donation: DonationConfig;
    onSuccess: () => void;
    returnUrl: string;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const estFee = estimateFee(donation.amount);
    const feeAmount = donation.coverFees ? estFee : 0;
    const tipAmount = Math.round((donation.amount + feeAmount) * donation.tipPercent);
    const total = donation.amount + feeAmount + tipAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        // Validate payment details
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message ?? 'Validation failed');
            setLoading(false);
            return;
        }

        // Create the PaymentIntent/Subscription on the server
        const res = await fetch('/v1/donations/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...donation,
                amount: donation.amount + feeAmount,
            }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            setError(data?.message ?? 'Failed to create payment. Please try again.');
            setLoading(false);
            return;
        }

        const { clientSecret } = await res.json();

        // Confirm the payment
        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: returnUrl,
            },
            redirect: 'if_required',
        });

        if (confirmError) {
            setError(confirmError.message ?? 'Payment failed. Please try again.');
            setLoading(false);
            return;
        }

        // Payment succeeded inline
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Text kind="paragraphSmall" style={{ fontWeight: 500 }}>
                    Order Summary
                </Text>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                        <Text kind="paragraphXSmall">Donation</Text>
                        <Text kind="paragraphXSmall">{formatCurrency(donation.amount, 2)}</Text>
                    </div>
                    {donation.coverFees && (
                        <div className="flex justify-between">
                            <Text kind="paragraphXSmall">Processing fees</Text>
                            <Text kind="paragraphXSmall">{formatCurrency(feeAmount, 2)}</Text>
                        </div>
                    )}
                    {tipAmount > 0 && (
                        <div className="flex justify-between">
                            <Text kind="paragraphXSmall">
                                {`Tip (${donation.tipPercent * 100}%)`}
                            </Text>
                            <Text kind="paragraphXSmall">{formatCurrency(tipAmount, 2)}</Text>
                        </div>
                    )}
                    <div
                        className="flex justify-between pt-2 mt-1"
                        style={{ borderTop: '1px solid var(--border-color, #e5e5e5)' }}
                    >
                        <Text kind="paragraphSmall" style={{ fontWeight: 600 }}>Total</Text>
                        <Text kind="paragraphSmall" style={{ fontWeight: 600 }}>
                            {formatCurrency(total, 2)}
                            {donation.frequency !== 'One-time' ? ' / month' : ''}
                        </Text>
                    </div>
                </div>
            </div>

            <PaymentElement options={{ layout: 'accordion' }} />

            {error && (
                <Text kind="paragraphXSmall" style={{ color: 'var(--error-color, #dc2626)' }}>
                    {error}
                </Text>
            )}

            <Button
                type="submit"
                disabled={!stripe || !elements || loading}
            >
                {loading
                    ? 'Processing...'
                    : `Donate ${formatCurrency(total, 2)}${donation.frequency !== 'One-time' ? ' / month' : ''}`}
            </Button>
        </form>
    );
};
