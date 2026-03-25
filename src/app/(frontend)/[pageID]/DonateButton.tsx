'use client';

import {
    useCallback, useEffect, useMemo, useState,
} from 'react';
import {
    useSearchParams, useRouter,
} from 'next/navigation';
import {
    Elements, ExpressCheckoutElement, useStripe, useElements,
} from '@stripe/react-stripe-js';
import type {
    StripeExpressCheckoutElementConfirmEvent,
    StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js';
import { Button } from 'paris/button';
import { Drawer } from 'paris/drawer';
import { Text } from 'paris/text';
import { ButtonGroup } from 'src/components/ButtonGroup';
import { formatCurrency } from 'src/util/formatCurrency';
import { Input } from 'paris/input';
import { TextArea } from 'paris/textarea';
import { Checkbox } from 'paris/checkbox';
import type { DonationConfig } from '@v1/donations/checkout/DonationConfig';
import { estimateFee, FrequencyOptions } from '@v1/donations/checkout/DonationConfig';
import { HappinessConfig } from 'happiness.config';
import { DonationAmountSelector } from 'src/components/DonationAmountSelector';
import { stripePromise } from '@lib/stripe/client';
import { CheckoutForm } from '@frontend/[pageID]/CheckoutForm';

import clsx from 'clsx';
import styles from 'src/app/(frontend)/[pageID]/DonateButton.module.scss';

export const AmountPresets = [1000, 2500, 5000, 10000, 25000] as number[];

type DrawerView = 'details' | 'payment';

const initialDonation: DonationConfig = {
    amount: 1000,
    frequency: 'One-time',
    message: '',
    coverFees: true,
    anonymous: false,
    projectName: HappinessConfig.name,
    pageID: '',
    tipPercent: 0.1,
};

/** Compute the total amount in cents for a given donation config */
const computeTotal = (donation: DonationConfig) => {
    const fee = donation.coverFees ? estimateFee(donation.amount) : 0;
    const tip = Math.round((donation.amount + fee) * donation.tipPercent);
    return donation.amount + fee + tip;
};

export const DonateButton = ({
    projectName,
    pageID,
    className = '',
}: {
    projectName?: string;
    pageID?: string;
    className?: string;
}) => {
    const params = useSearchParams();
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [donation, setDonation] = useState<DonationConfig>({
        ...initialDonation,
        projectName: projectName || HappinessConfig.name,
        pageID: pageID || '',
    });

    const [showOtherAmount, setShowOtherAmount] = useState(false);
    const [otherAmountInput, setOtherAmountInput] = useState('');
    const [view, setView] = useState<DrawerView>('details');

    const total = useMemo(() => computeTotal(donation), [donation]);

    const elementsMode = donation.frequency === 'Monthly' ? 'subscription' : 'payment';

    useEffect(() => {
        if (params.get('open') === 'donate') {
            setDrawerOpen(true);
        }
    }, [params]);

    const handleClose = useCallback(() => {
        setDrawerOpen(false);
        setDonation({
            ...initialDonation,
            projectName: projectName || HappinessConfig.name,
            pageID: pageID || '',
        });
        setShowOtherAmount(false);
        setOtherAmountInput('');
        setView('details');
    }, [projectName, pageID]);

    const handleSuccess = useCallback(() => {
        const name = donation.anonymous ? 'Anonymous' : 'Donor';
        handleClose();
        router.replace(`/${pageID}?thanks=${encodeURIComponent(name)}`);
    }, [handleClose, donation.anonymous, pageID, router]);

    return (
        <>
            <Button
                onClick={() => setDrawerOpen(true)}
                className={className}
            >
                Donate
            </Button>
            {drawerOpen && (
                <Elements
                    key={`${elementsMode}-${donation.frequency}`}
                    stripe={stripePromise}
                    options={{
                        mode: elementsMode,
                        amount: Math.max(total, 50),
                        currency: 'usd',
                        appearance: {
                            theme: 'stripe',
                            variables: {
                                borderRadius: '8px',
                            },
                        },
                    }}
                >
                    {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
                    <DonateDrawerContent
                        drawerOpen={drawerOpen}
                        onClose={handleClose}
                        donation={donation}
                        setDonation={setDonation}
                        showOtherAmount={showOtherAmount}
                        setShowOtherAmount={setShowOtherAmount}
                        otherAmountInput={otherAmountInput}
                        setOtherAmountInput={setOtherAmountInput}
                        view={view}
                        setView={setView}
                        total={total}
                        onSuccess={handleSuccess}
                    />
                </Elements>
            )}
        </>
    );
};

/**
 * Inner component that renders inside <Elements>.
 * Needed because useStripe/useElements can only be called within the Elements provider.
 */
const DonateDrawerContent = ({
    drawerOpen,
    onClose,
    donation,
    setDonation,
    showOtherAmount,
    setShowOtherAmount,
    otherAmountInput,
    setOtherAmountInput,
    view,
    setView,
    total,
    onSuccess,
}: {
    drawerOpen: boolean;
    onClose: () => void;
    donation: DonationConfig;
    setDonation: React.Dispatch<React.SetStateAction<DonationConfig>>;
    showOtherAmount: boolean;
    setShowOtherAmount: (v: boolean) => void;
    otherAmountInput: string;
    setOtherAmountInput: (v: string) => void;
    view: DrawerView;
    setView: (v: DrawerView) => void;
    total: number;
    onSuccess: () => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();

    const [expressCheckoutReady, setExpressCheckoutReady] = useState(false);
    const [expressError, setExpressError] = useState<string | null>(null);
    const [expressLoading, setExpressLoading] = useState(false);

    const estFee = useMemo(() => estimateFee(donation.amount), [donation.amount]);
    const feeAmount = donation.coverFees ? estFee : 0;

    // Keep Elements amount in sync with donation total
    useEffect(() => {
        if (elements) {
            elements.update({
                amount: Math.max(total, 50),
            });
        }
    }, [elements, total]);

    const returnUrl = useMemo(
        () => (typeof window !== 'undefined'
            ? `${window.location.origin}/v1/donations/checkout/success`
            : ''),
        [],
    );

    const createIntentAndConfirm = useCallback(async () => {
        if (!stripe || !elements) return;

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
            }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message ?? 'Failed to create payment');
        }

        const { clientSecret } = await res.json();

        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: returnUrl,
            },
            redirect: 'if_required',
        });

        if (confirmError) {
            throw new Error(confirmError.message ?? 'Payment failed');
        }

        onSuccess();
    }, [stripe, elements, donation, feeAmount, returnUrl, onSuccess]);

    const handleExpressCheckoutConfirm = useCallback(async (
        event: StripeExpressCheckoutElementConfirmEvent,
    ) => {
        setExpressLoading(true);
        setExpressError(null);
        try {
            await createIntentAndConfirm();
        } catch (e) {
            event.paymentFailed({ reason: 'fail' });
            setExpressError(e instanceof Error ? e.message : 'Payment failed');
        } finally {
            setExpressLoading(false);
        }
    }, [createIntentAndConfirm]);

    const handleExpressCheckoutReady = useCallback((
        event: StripeExpressCheckoutElementReadyEvent,
    ) => {
        const methods = event.availablePaymentMethods;
        setExpressCheckoutReady(
            Boolean(methods && (methods.applePay || methods.googlePay || methods.link)),
        );
    }, []);

    return (
        <Drawer
            title={view === 'payment' ? 'Payment' : 'Donate'}
            isOpen={drawerOpen}
            onClose={onClose}
        >
            {view === 'details' && (
                <div className="w-full flex flex-col gap-6">
                    <ButtonGroup
                        options={FrequencyOptions.map((f) => ({ id: f, name: f }))}
                        selected={donation.frequency}
                        onChange={({ id }) => {
                            setDonation((d) => ({
                                ...d,
                                frequency: id as DonationConfig['frequency'],
                            }));
                        }}
                    />
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-3 gap-2">
                            {AmountPresets.map((amount) => (
                                <DonationAmountSelector
                                    selected={donation.amount === amount}
                                    key={amount}
                                    onClick={() => {
                                        setDonation((d) => ({
                                            ...d,
                                            amount,
                                        }));
                                        setShowOtherAmount(false);
                                    }}
                                >
                                    <Text
                                        kind="paragraphSmall"
                                        style={{ fontWeight: 500 }}
                                    >
                                        {formatCurrency(amount, 0)}
                                    </Text>
                                </DonationAmountSelector>
                            ))}
                            <DonationAmountSelector
                                selected={!AmountPresets.includes(donation.amount)}
                                key="otherAmount"
                                onClick={() => {
                                    setDonation((d) => ({
                                        ...d,
                                        amount: 0,
                                    }));
                                    setOtherAmountInput('');
                                    setShowOtherAmount(true);
                                }}
                            >
                                <Text
                                    kind="paragraphSmall"
                                    style={{ fontWeight: 500 }}
                                >
                                    Other
                                </Text>
                            </DonationAmountSelector>
                        </div>
                        <div
                            className="overflow-clip"
                            style={{
                                transition: 'all 0.2s ease-in-out',
                                maxHeight: showOtherAmount ? '40px' : 0,
                                marginBottom: showOtherAmount ? '0px' : '-8px',
                            }}
                        >
                            <Input
                                label="Other amount"
                                hideLabel
                                placeholder="Enter amount"
                                type="text"
                                value={otherAmountInput}
                                startEnhancer="$"
                                onChange={(e) => {
                                    const { value } = e.target;
                                    if (/^[0-9]+(\.[0-9]{0,2}|)$/.test(value) || value === '') {
                                        setOtherAmountInput(value);
                                        setDonation((d) => ({
                                            ...d,
                                            amount: Number(value) * 100,
                                        }));
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <TextArea
                        label={(
                            <div>
                                <Text
                                    kind="paragraphSmall"
                                    style={{ fontWeight: 500 }}
                                >
                                    Message
                                </Text>
                                {' '}
                                <Text kind="paragraphSmall">
                                    (optional)
                                </Text>
                            </div>
                        )}
                        placeholder="Keep up the good work!"
                        value={donation.message}
                        style={{ minHeight: '80px' }}
                        onChange={(e) => {
                            const { value } = e.target;
                            setDonation((d) => ({
                                ...d,
                                message: value,
                            }));
                        }}
                    />
                    <div className={clsx(styles.TempCheckboxSpacing)}>
                        <Checkbox
                            checked={donation.coverFees}
                            onChange={(e) => {
                                setDonation((d) => ({
                                    ...d,
                                    coverFees: Boolean(e),
                                }));
                            }}
                        >
                            <Text kind="paragraphXSmall">
                                Add
                                {' '}
                                <strong>
                                    {formatCurrency(estFee, 2)}
                                </strong>
                                {' '}
                                to cover processing fees
                            </Text>
                        </Checkbox>
                    </div>
                    <div className={clsx(styles.TempCheckboxSpacing)}>
                        <Checkbox
                            checked={donation.anonymous}
                            onChange={(e) => {
                                setDonation((d) => ({
                                    ...d,
                                    anonymous: Boolean(e),
                                }));
                            }}
                        >
                            <Text kind="paragraphXSmall">
                                Make my donation anonymous
                            </Text>
                        </Checkbox>
                    </div>
                    <div className={clsx(styles.TempCheckboxSpacing)}>
                        <Checkbox
                            checked={donation.tipPercent !== 0}
                            onChange={(e) => {
                                setDonation((d) => ({
                                    ...d,
                                    tipPercent: e ? 0.05 : 0,
                                }));
                            }}
                        >
                            <Text kind="paragraphXSmall">
                                Add a tip for
                                {' '}
                                {HappinessConfig.name}
                            </Text>
                        </Checkbox>
                        {donation.tipPercent !== 0 ? (
                            <div className="flex flex-col mt-4 gap-4">
                                <Text kind="paragraphXSmall">
                                    {HappinessConfig.tipDescription}
                                </Text>
                                <div className="grid grid-cols-3 gap-2">
                                    {[0.05, 0.1, 0.2].map((pct) => (
                                        <DonationAmountSelector
                                            key={`tip-${pct}`}
                                            size="small"
                                            selected={donation.tipPercent === pct}
                                            onClick={() => {
                                                setDonation((d) => ({
                                                    ...d,
                                                    tipPercent: pct,
                                                }));
                                            }}
                                        >
                                            <Text
                                                kind="paragraphXSmall"
                                                style={{ fontWeight: 500 }}
                                            >
                                                {pct * 100}
                                                %
                                            </Text>
                                        </DonationAmountSelector>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Express Checkout (Apple Pay, Google Pay, Link) */}
                    {expressCheckoutReady && donation.amount > 0 && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <Text kind="paragraphXSmall" style={{ color: '#6b7280' }}>
                                    Express checkout
                                </Text>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            <ExpressCheckoutElement
                                onConfirm={handleExpressCheckoutConfirm}
                                onReady={handleExpressCheckoutReady}
                                options={{
                                    buttonType: {
                                        applePay: 'donate',
                                        googlePay: 'donate',
                                    },
                                }}
                            />
                            {expressError && (
                                <Text kind="paragraphXSmall" style={{ color: 'var(--error-color, #dc2626)' }}>
                                    {expressError}
                                </Text>
                            )}
                        </div>
                    )}

                    {/* Hidden Express Checkout to detect availability */}
                    {!expressCheckoutReady && (
                        <div style={{
                            position: 'absolute',
                            opacity: 0,
                            pointerEvents: 'none',
                            height: 0,
                            overflow: 'hidden',
                        }}
                        >
                            <ExpressCheckoutElement
                                onReady={handleExpressCheckoutReady}
                                onConfirm={handleExpressCheckoutConfirm}
                            />
                        </div>
                    )}

                    <Button
                        onClick={() => setView('payment')}
                        disabled={donation.amount === 0 || expressLoading}
                    >
                        {`Continue to Payment \u2014 ${formatCurrency(total, 2)}${donation.frequency === 'One-time' ? '' : ' / month'}`}
                    </Button>
                </div>
            )}

            {view === 'payment' && (
                <div className="w-full flex flex-col gap-4">
                    <Button
                        kind="tertiary"
                        size="small"
                        onClick={() => setView('details')}
                    >
                        &larr; Back to details
                    </Button>
                    <CheckoutForm
                        donation={donation}
                        onSuccess={onSuccess}
                        returnUrl={returnUrl}
                    />
                </div>
            )}
        </Drawer>
    );
};
