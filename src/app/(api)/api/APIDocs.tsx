'use client';

import '@stoplight/elements/styles.min.css';
import { useEffect, useState } from 'react';

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'elements-api': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                apiDescriptionDocument?: string;
                router?: string;
                layout?: string;
                basePath?: string;
            };
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

    return !isClient ? (
        <div />
    ) : (
        <elements-api
            apiDescriptionDocument={spec}
            router="history"
            layout="sidebar"
            basePath="/api"
        />
    );
};
