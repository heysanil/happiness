'use client';

import {
    forwardRef, useEffect, useState,
} from 'react';
import {
    PaymentElement,
    ExpressCheckoutElement,
    LinkAuthenticationElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import type {
    StripeExpressCheckoutElementConfirmEvent,
    StripeLinkAuthenticationElementChangeEvent,
} from '@stripe/stripe-js';
import { Text } from 'paris/text';
import { formatCurrency } from 'src/util/formatCurrency';
import type { DonationConfig } from '@v1/donations/checkout/DonationConfig';
import { estimateFee } from '@v1/donations/checkout/DonationConfig';

export const CheckoutForm = forwardRef<
HTMLFormElement,
{
    donation: DonationConfig;
    onSuccess: () => void;
    returnUrl: string;
    onLoadingChange?: (loading: boolean) => void;
    onBillingChange: (fields: { email?: string; donorName?: string }) => void;
}
>(({
            donation,
            onSuccess,
            returnUrl,
            onLoadingChange,
            onBillingChange,
        }, ref) => {
            const stripe = useStripe();
            const elements = useElements();
            const [error, setError] = useState<string | null>(null);
            const [loading, setLoading] = useState(false);
            const [expressCheckoutAvailable, setExpressCheckoutAvailable] = useState(false);

            const estFee = estimateFee(donation.amount);
            const feeAmount = donation.coverFees ? estFee : 0;
            const tipAmount = Math.round((donation.amount + feeAmount) * donation.tipPercent);
            const total = donation.amount + feeAmount + tipAmount;

            useEffect(() => {
                onLoadingChange?.(loading);
            }, [loading, onLoadingChange]);

            const createIntentAndConfirm = async (billingOverrides?: {
                email?: string;
                name?: string;
            }) => {
                if (!stripe || !elements) return;

                const email = billingOverrides?.email || donation.email;
                const name = billingOverrides?.name || donation.donorName;

                const { error: submitError } = await elements.submit();
                if (submitError) {
                    throw new Error(submitError.message ?? 'Validation failed');
                }

                const res = await fetch('/v1/donations/create-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...donation,
                        amount: donation.amount + feeAmount,
                        email,
                        donorName: name,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.message ?? 'Failed to create payment.');
                }

                const { clientSecret } = await res.json();

                const { error: confirmError } = await stripe.confirmPayment({
                    elements,
                    clientSecret,
                    confirmParams: {
                        return_url: returnUrl,
                        receipt_email: email,
                        payment_method_data: {
                            billing_details: {
                                email,
                                name: name || undefined,
                            },
                        },
                    },
                    redirect: 'if_required',
                });

                if (confirmError) {
                    throw new Error(confirmError.message ?? 'Payment failed.');
                }

                onSuccess();
            };

            const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                try {
                    await createIntentAndConfirm();
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Payment failed.');
                    setLoading(false);
                }
            };

            const handleExpressConfirm = async (
                event: StripeExpressCheckoutElementConfirmEvent,
            ) => {
                setLoading(true);
                setError(null);
                try {
                    await createIntentAndConfirm({
                        email: event.billingDetails?.email || undefined,
                        name: event.billingDetails?.name || undefined,
                    });
                } catch (err) {
                    event.paymentFailed({ reason: 'fail' });
                    setError(err instanceof Error ? err.message : 'Payment failed.');
                    setLoading(false);
                }
            };

            return (
                <form ref={ref} onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
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
                                style={{ borderTop: '1px solid var(--pte-colors-borderOpaque, #e5e5e5)' }}
                            >
                                <Text kind="paragraphSmall" style={{ fontWeight: 600 }}>Total</Text>
                                <Text kind="paragraphSmall" style={{ fontWeight: 600 }}>
                                    {formatCurrency(total, 2)}
                                    {donation.frequency !== 'One-time' ? ' / month' : ''}
                                </Text>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: expressCheckoutAvailable ? undefined : 'none' }}>
                        <ExpressCheckoutElement
                            onConfirm={handleExpressConfirm}
                            onReady={({ availablePaymentMethods }) => {
                                if (availablePaymentMethods) {
                                    setExpressCheckoutAvailable(true);
                                }
                            }}
                            options={{
                                emailRequired: true,
                                buttonType: {
                                    applePay: 'donate',
                                    googlePay: 'donate',
                                },
                            }}
                        />
                    </div>

                    {expressCheckoutAvailable && (
                        <div className="flex items-center gap-3">
                            <div
                                className="flex-1 h-px"
                                style={{ background: 'var(--pte-colors-borderOpaque, #e5e5e5)' }}
                            />
                            <Text
                                kind="paragraphXSmall"
                                style={{ color: 'var(--pte-colors-contentTertiary, #6b7280)' }}
                            >
                                Or pay with card
                            </Text>
                            <div
                                className="flex-1 h-px"
                                style={{ background: 'var(--pte-colors-borderOpaque, #e5e5e5)' }}
                            />
                        </div>
                    )}

                    <LinkAuthenticationElement
                        onChange={(e: StripeLinkAuthenticationElementChangeEvent) => {
                            onBillingChange({ email: e.value.email });
                        }}
                    />

                    <PaymentElement options={{
                        layout: 'accordion',
                        fields: { billingDetails: { name: 'auto' } },
                    }} />

                    {error && (
                        <Text kind="paragraphXSmall" style={{ color: 'var(--pte-colors-contentNegative, #dc2626)' }}>
                            {error}
                        </Text>
                    )}
                </form>
            );
        });

CheckoutForm.displayName = 'CheckoutForm';
