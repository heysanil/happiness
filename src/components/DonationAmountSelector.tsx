import clsx from 'clsx';
import type { FC } from 'react';
import styles from 'src/components/DonationAmountSelector.module.scss';

export interface DonationAmountSelectorProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    selected?: boolean;
    size?: 'default' | 'small';
}

export const DonationAmountSelector: FC<DonationAmountSelectorProps> = ({
    selected = false,
    size = 'default',
    children,
    ...props
}) => (
    <button
        type="button"
        data-selected={selected}
        className={clsx(
            styles.DonationAmountSelector,
            'flex justify-center items-center',
            size === 'default' && 'py-3 px-2 gap-2',
            size === 'small' && 'py-2 px-1 gap-1',
        )}
        {...props}
    >
        {children}
    </button>
);
