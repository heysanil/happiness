'use client';

import '@stoplight/elements/styles.min.css';
import { useEffect, useState } from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'elements-api': any;
        }
    }
}

/**
 * Renders the API documentation in a Stoplight Elements web component. You must run import the Stoplight Elements script in the layout file.
 */
export const APIDocs = ({ spec }: { spec: string }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            const api = document.querySelector('elements-api') as any;
            if (api) {
                api.apiDescriptionDocument = spec;
            }
        }
    }, [isClient, spec]);

    return !isClient
        ? (<div />)
        : (
            <elements-api
                apiDescriptionDocument={spec}
                router="history"
                layout="sidebar"
                basePath="/api"
            />
        );
};
