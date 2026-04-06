'use client';

import { useEffect, useState } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <div
                    style={{
                        minHeight: '100dvh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        fontFamily:
                            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        background: '#fafafa',
                        margin: 0,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '24px',
                            maxWidth: '400px',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: '#f0f0f0',
                            }}
                        >
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 512 512"
                                fill="#666"
                                role="img"
                                aria-label="Warning"
                            >
                                <title>Warning</title>
                                <path d="M248.4 84.3c1.6-2.7 4.5-4.3 7.6-4.3s6 1.6 7.6 4.3L461.9 410c1.4 2.3 2.1 4.9 2.1 7.5c0 8-6.5 14.5-14.5 14.5l-387 0c-8 0-14.5-6.5-14.5-14.5c0-2.7 .7-5.3 2.1-7.5L248.4 84.3zm-41-25L9.1 385c-6 9.8-9.1 21-9.1 32.5C0 452 28 480 62.5 480l387 0c34.5 0 62.5-28 62.5-62.5c0-11.5-3.2-22.7-9.1-32.5L304.6 59.3C294.3 42.4 275.9 32 256 32s-38.3 10.4-48.6 27.3zM288 368a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm-8-184c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 96c0 13.3 10.7 24 24 24s24-10.7 24-24l0-96z" />
                            </svg>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            <h1
                                style={{
                                    fontSize: '24px',
                                    fontWeight: 600,
                                    color: '#1a1a1a',
                                    margin: 0,
                                }}
                            >
                                Something went wrong
                            </h1>
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#666',
                                    margin: 0,
                                    lineHeight: 1.5,
                                }}
                            >
                                We encountered an unexpected error. Our team has
                                been notified and is working to fix it.
                            </p>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '12px',
                                marginTop: '8px',
                            }}
                        >
                            <a
                                href="/"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#1a1a1a',
                                    background: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                Go home
                            </a>
                            <button
                                type="button"
                                onClick={() => reset()}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#fff',
                                    background: '#1a1a1a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                Try again
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            style={{
                                marginTop: '16px',
                                fontSize: '12px',
                                color: '#888',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                            }}
                        >
                            {showDetails ? 'Hide details' : 'Show details'}
                        </button>
                        {showDetails && (
                            <div
                                style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: '#f0f0f0',
                                    textAlign: 'left',
                                    width: '100%',
                                    maxWidth: '500px',
                                    overflow: 'auto',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '13px',
                                        fontFamily: 'monospace',
                                        color: '#444',
                                        marginBottom: '8px',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {error.message}
                                </div>
                                {error.stack && (
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            color: '#888',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            maxHeight: '200px',
                                            overflow: 'auto',
                                        }}
                                    >
                                        {error.stack}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
