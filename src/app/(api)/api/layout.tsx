import type { ReactNode } from 'react';
import Script from 'next/script';
import * as fs from 'fs';
import { Fira_Code } from 'next/font/google';

export const runtime = 'nodejs';

const code = Fira_Code({ subsets: ['latin'], display: 'swap' });
const customStyles = `a[href^="https://stoplight"] {
    display: none;
}

:root {
    --font-prose: -apple-system, ui-sans-serif, system-ui, sans-serif;
    --font-ui: -apple-system, ui-sans-serif, system-ui, sans-serif;
    --font-code: ${code.style.fontFamily}, ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    --font-mono: ${code.style.fontFamily}, ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}`;

export default function DocsLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <style
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: customStyles,
                }}
            />
            <section className="w-full h-screen">
                {children}
            </section>
            <Script
                strategy="beforeInteractive"
            >
                {fs.readFileSync('./node_modules/@stoplight/elements/web-components.min.js', 'utf8')}
            </Script>
        </>
    );
}
