'use client';

import {
    useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
    useSearchParams, useRouter,
} from 'next/navigation';
import {
    Elements, useStripe, useElements,
} from '@stripe/react-stripe-js';
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
import { usePagination } from 'paris/pagination';

import clsx from 'clsx';
import styles from 'src/app/(frontend)/[pageID]/DonateButton.module.scss';

export const AmountPresets = [1000, 2500, 5000, 10000, 25000] as number[];

const DrawerPages = ['details', 'payment'] as const;

const STRIPE_APPEARANCE = {
    theme: 'flat' as const,
    labels: 'above' as const,
    variables: {
        borderRadius: '0px',
        fontFamily: "'Graphik Web', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen, Ubuntu, Cantarell, \"Open Sans\", \"Helvetica Neue\", sans-serif",
        colorPrimary: '#131313',
        fontSizeBase: '14px',
        spacingUnit: '3px',
    },
};

const initialDonation: DonationConfig = {
    amount: 1000,
    frequency: 'One-time',
    message: '',
    coverFees: true,
    anonymous: false,
    projectName: HappinessConfig.name,
    pageID: '',
    tipPercent: 0.1,
    email: '',
    donorName: '',
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
    const [paymentLoading, setPaymentLoading] = useState(false);

    const pagination = usePagination<typeof DrawerPages>('details');
    const checkoutFormRef = useRef<HTMLFormElement>(null);

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
        pagination.reset();
    }, [projectName, pageID, pagination]);

    const handleSuccess = useCallback(() => {
        const name = donation.anonymous ? 'Anonymous' : 'Donor';
        handleClose();
        router.replace(`/${pageID}?thanks=${encodeURIComponent(name)}`);
    }, [handleClose, donation.anonymous, pageID, router]);

    const estFee = useMemo(() => estimateFee(donation.amount), [donation.amount]);

    const bottomPanel = useMemo(() => {
        if (pagination.currentPage === 'details') {
            return (
                <Button
                    onClick={() => pagination.open('payment')}
                    disabled={donation.amount === 0}
                    style={{ width: '100%' }}
                >
                    {`Continue to Payment \u2014 ${formatCurrency(total, 2)}${donation.frequency === 'One-time' ? '' : ' / month'}`}
                </Button>
            );
        }
        return (
            <Button
                onClick={() => {
                    checkoutFormRef.current?.requestSubmit();
                }}
                disabled={paymentLoading || !donation.email}
                style={{ width: '100%' }}
            >
                {paymentLoading
                    ? 'Processing...'
                    : `Donate ${formatCurrency(total, 2)}${donation.frequency === 'One-time' ? '' : ' / month'}`}
            </Button>
        );
    }, [pagination, donation.amount, donation.frequency, donation.email, total, paymentLoading]);

    return (
        <>
            <Button
                onClick={() => setDrawerOpen(true)}
                className={className}
            >
                Donate
            </Button>
            <Drawer
                title="Donate"
                isOpen={drawerOpen}
                onClose={() => handleClose()}
                pagination={pagination}
                bottomPanel={bottomPanel}
            >
                <Elements
                    key={`${elementsMode}-${donation.frequency}`}
                    stripe={stripePromise}
                    options={{
                        mode: elementsMode,
                        amount: Math.max(total, 50),
                        currency: 'usd',
                        appearance: STRIPE_APPEARANCE,
                    }}
                >
                    {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
                    <DonateDrawerInner
                        donation={donation}
                        setDonation={setDonation}
                        showOtherAmount={showOtherAmount}
                        setShowOtherAmount={setShowOtherAmount}
                        otherAmountInput={otherAmountInput}
                        setOtherAmountInput={setOtherAmountInput}
                        total={total}
                        estFee={estFee}
                        onSuccess={handleSuccess}
                        checkoutFormRef={checkoutFormRef}
                        setPaymentLoading={setPaymentLoading}
                        currentPage={pagination.currentPage}
                    />
                </Elements>
            </Drawer>
        </>
    );
};

/**
 * Inner component rendered inside <Elements>.
 * Since the Drawer with pagination expects keyed children, but we need
 * useStripe/useElements hooks, we render inside Elements and output
 * the keyed page divs directly for the Drawer's pagination to pick up.
 *
 * NOTE: The Drawer matches children by their React `key` prop against
 * pagination.currentPage. We return a flat array of keyed divs.
 */
const DonateDrawerInner = ({
    donation,
    setDonation,
    showOtherAmount,
    setShowOtherAmount,
    otherAmountInput,
    setOtherAmountInput,
    total,
    estFee,
    onSuccess,
    checkoutFormRef,
    setPaymentLoading,
    currentPage,
}: {
    donation: DonationConfig;
    setDonation: React.Dispatch<React.SetStateAction<DonationConfig>>;
    showOtherAmount: boolean;
    setShowOtherAmount: (v: boolean) => void;
    otherAmountInput: string;
    setOtherAmountInput: (v: string) => void;
    total: number;
    estFee: number;
    onSuccess: () => void;
    checkoutFormRef: React.RefObject<HTMLFormElement | null>;
    setPaymentLoading: (v: boolean) => void;
    currentPage: string;
}) => {
    const elements = useElements();

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

    return (
        <>
            {currentPage === 'details' && (
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
                </div>
            )}

            {currentPage === 'payment' && (
                <div className="w-full">
                    <CheckoutForm
                        ref={checkoutFormRef as React.Ref<HTMLFormElement>}
                        donation={donation}
                        onSuccess={onSuccess}
                        returnUrl={returnUrl}
                        onLoadingChange={setPaymentLoading}
                        onBillingChange={(fields) => setDonation((d) => ({ ...d, ...fields }))}
                    />
                </div>
            )}
        </>
    );
};
