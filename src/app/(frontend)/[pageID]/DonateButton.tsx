'use client';

import { useMemo, useState } from 'react';
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

export const AmountPresets = [1000, 2500, 5000, 10000, 25000] as number[];

const initialDonation: DonationConfig = {
    amount: 1000,
    frequency: 'One-time',
    message: '',
    coverFees: true,
    anonymous: false,
    projectName: HappinessConfig.name,
    pageID: '',
};

export const DonateButton = ({
    projectName,
    pageID,
}: {
    projectName?: string,
    pageID?: string,
}) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [donation, setDonation] = useState<DonationConfig>(initialDonation);

    const [showOtherAmount, setShowOtherAmount] = useState(false);
    const [otherAmountInput, setOtherAmountInput] = useState('' as string);

    const estFee = useMemo(() => (
        estimateFee(donation.amount)
    ), [donation.amount]);

    const checkoutURL = useMemo(() => (
        `/v1/donations/checkout?${new URLSearchParams(
            Object.fromEntries(
                Object.entries({
                    ...donation,
                    amount: donation.amount + (donation.coverFees ? estFee : 0),
                    pageName: projectName || HappinessConfig.name,
                    pageID,
                }).map(([key, value]) => [key, String(value)]),
            ),
        ).toString()}`
    ), [donation, estFee, pageID, projectName]);

    return (
        <>
            <Button
                onClick={() => setDrawerOpen(true)}
            >
                Donate
            </Button>
            <Drawer
                title="Donate"
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setDonation(initialDonation);
                    setShowOtherAmount(false);
                }}
            >
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
                <div className="grid grid-cols-3 gap-2">
                    {AmountPresets.map((amount) => (
                        <Button
                            shape="rectangle"
                            kind={amount === donation.amount ? 'primary' : 'secondary'}
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
                                kind="labelMedium"
                                style={{
                                    fontWeight: amount === donation.amount ? 600 : 500,
                                    letterSpacing: '0',
                                }}
                            >
                                {formatCurrency(amount, 0)}
                            </Text>
                        </Button>
                    ))}
                    <Button
                        shape="rectangle"
                        kind={!AmountPresets.includes(donation.amount) ? 'primary' : 'secondary'}
                        key="otherAmount"
                        onClick={() => {
                            setDonation((d) => ({
                                ...d,
                                amount: 0,
                            }));
                            setShowOtherAmount(true);
                        }}
                    >
                        <Text
                            kind="labelMedium"
                            style={{
                                fontWeight: !AmountPresets.includes(donation.amount) ? 600 : 500,
                                letterSpacing: '0',
                                textTransform: 'none',
                            }}
                        >
                            Other
                        </Text>
                    </Button>
                </div>
                <div
                    className="overflow-clip"
                    style={{
                        transition: 'all 0.2s ease-in-out',
                        maxHeight: showOtherAmount ? '40px' : 0,
                        marginBottom: showOtherAmount ? 0 : '-24px',
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
                <TextArea
                    label="Leave a message (optional)"
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
                <div className="flex flex-row gap-2 justify-start items-center">
                    <Checkbox
                        checked={donation.anonymous}
                        onChange={(e) => {
                            setDonation((d) => ({
                                ...d,
                                anonymous: Boolean(e),
                            }));
                        }}
                    >
                        <Text kind="paragraphSmall">
                            Don't show my donation publicly
                        </Text>
                    </Checkbox>
                </div>
                <div className="flex flex-row gap-2 justify-start items-center">
                    <Checkbox
                        checked={donation.coverFees}
                        onChange={(e) => {
                            setDonation((d) => ({
                                ...d,
                                coverFees: Boolean(e),
                            }));
                        }}
                    >
                        <Text kind="paragraphSmall">
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
                <Button
                    href={checkoutURL}
                    hrefTarget="_self"
                    disabled={donation.amount === 0}
                >
                    {`Donate ${formatCurrency(donation.amount + (donation.coverFees ? estFee : 0), 2)}`}
                </Button>
            </Drawer>
        </>
    );
};
