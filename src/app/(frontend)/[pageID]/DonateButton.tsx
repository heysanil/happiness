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
import { DonationAmountSelector } from 'src/components/DonationAmountSelector';

import clsx from 'clsx';
import styles from 'src/app/(frontend)/[pageID]/DonateButton.module.scss';

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
                                    style={{
                                        fontWeight: 500,
                                    }}
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
                                style={{
                                    fontWeight: 500,
                                }}
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
                    // @ts-expect-error -- TODO: ENG-45
                    label={(
                        <div>
                            <Text
                                kind="paragraphSmall"
                                style={{
                                    fontWeight: 500,
                                }}
                            >
                                Message
                            </Text>
                            {' '}
                            <Text
                                kind="paragraphSmall"
                            >
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
                <div className={clsx(
                    styles.TempCheckboxSpacing,
                )}
                >
                    <Checkbox
                        checked={donation.coverFees}
                        onChange={(e) => {
                            setDonation((d) => ({
                                ...d,
                                coverFees: Boolean(e),
                            }));
                        }}
                    >
                        <Text
                            kind="paragraphXSmall"
                        >
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
                <div className={
                    clsx(
                        styles.TempCheckboxSpacing,
                    )
                }
                >
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
                <Button
                    href={checkoutURL}
                    hrefTarget="_self"
                    disabled={donation.amount === 0}
                >
                    {`Donate ${formatCurrency(donation.amount + (donation.coverFees ? estFee : 0), 2)}${donation.frequency === 'One-time' ? '' : ' / month'}`}
                </Button>
            </Drawer>
        </>
    );
};
