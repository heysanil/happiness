import { Button } from 'paris/button/Button';
import type { FC } from 'react';

import clsx from 'clsx';
import styles from 'src/components/DonationAmountSelector.module.scss';

export interface DonationAmountSelectorProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    selected?: boolean;
}

export const DonationAmountSelector: FC<DonationAmountSelectorProps> = ({
    selected = false,
    children,
    ...props
}) => (
    <button
        type="button"
        data-selected={selected}
        className={clsx(
            styles.DonationAmountSelector,
            'flex justify-center items-center p-3 px-2 gap-2',

        )}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
    >
        {children}
    </button>
);
