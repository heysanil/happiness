'use client';

import type { FC } from 'react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateTheme } from 'paris/theme';

export const Themer: FC = () => {
    const searchParams = useSearchParams();
    const bg = searchParams.get('bg');

    useEffect(() => {
        updateTheme({
            // @ts-expect-error - PTE needs to update to `DeepPartial` for updateTheme param typing
            colors: {
                ...bg ? { backgroundPrimary: `#${bg}` } : {},
            },
        });
    }, [bg]);

    return <></>;
};
