'use client';

import { Button } from 'paris/button';
import { Text } from 'paris/text';
import { useEffect } from 'react';
import { DebugMode } from 'src/constants';

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js error page convention
export default function Error({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col gap-4 m-4">
            <Text as="h1" kind="displaySmall">
                Something went wrong
            </Text>
            <Text as="p" kind="paragraphMedium">
                {error.message}
            </Text>
            {DebugMode && <pre>{error.stack}</pre>}
            <div>
                <Button onClick={() => reset()}>Try again</Button>
            </div>
        </div>
    );
}
