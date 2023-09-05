'use client';

/* eslint-disable react/jsx-props-no-spreading */
import type { FC } from 'react';
import { share } from '@frontend/[pageID]/share';
import type { ButtonProps } from 'paris/button';
import { Button } from 'paris/button';
import type { Page } from '@db/schema';

export const ShareButton: FC<{
    page: Page,
    children?: string,
} & Omit<ButtonProps, 'children'>> = ({
    page,
    onClick,
    children,
    ...props
}) => (
    <Button
        kind="secondary"
        {...props}
        onClick={async (e) => {
            await share(page);
            onClick?.(e);
        }}
    >
        {children || 'Share'}
    </Button>
);
