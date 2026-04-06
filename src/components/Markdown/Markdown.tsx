'use client';

import { clsx } from 'clsx';
import { Accordion } from 'paris/accordion';
import { Callout } from 'paris/callout';
import { StyledLink } from 'paris/styledlink';
import { Text } from 'paris/text';
import { pvar } from 'paris/theme';
import type { FC, ReactNode } from 'react';
import { Children, isValidElement } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import styles from './markdown.module.scss';

/**
 * Extracts plain text from React children recursively.
 * Useful for generating IDs from heading content.
 */
function extractText(children: ReactNode): string {
    return Children.toArray(children)
        .map((child) => {
            if (typeof child === 'string') return child;
            if (typeof child === 'number') return String(child);
            if (
                isValidElement<{ children?: ReactNode }>(child) &&
                child.props?.children
            ) {
                return extractText(child.props.children);
            }
            return '';
        })
        .join('');
}

/**
 * Maps heading level to Paris Text `kind` and HTML element.
 */
const headingConfig = {
    1: { kind: 'headingLarge', as: 'h1' },
    2: { kind: 'headingMedium', as: 'h2' },
    3: { kind: 'headingSmall', as: 'h3' },
    4: { kind: 'headingXSmall', as: 'h4' },
    5: { kind: 'headingXXSmall', as: 'h5' },
    6: { kind: 'labelMedium', as: 'h6' },
} as const;

/**
 * The react-markdown component overrides, mapping markdown elements
 * to Paris design system components and custom styled elements.
 */
const markdownComponents: Components = {
    // ── Headings ──────────────────────────────────────────────
    h1: ({ children }) => {
        const id = extractText(children)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        const { kind, as } = headingConfig[1];
        return (
            <Text as={as} kind={kind} className={styles.heading} id={id}>
                {children}
            </Text>
        );
    },
    h2: ({ children }) => {
        const id = extractText(children)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        const { kind, as } = headingConfig[2];
        return (
            <Text as={as} kind={kind} className={styles.heading} id={id}>
                {children}
            </Text>
        );
    },
    h3: ({ children }) => {
        const id = extractText(children)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        const { kind, as } = headingConfig[3];
        return (
            <Text as={as} kind={kind} className={styles.heading} id={id}>
                {children}
            </Text>
        );
    },
    h4: ({ children }) => {
        const id = extractText(children)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        const { kind, as } = headingConfig[4];
        return (
            <Text as={as} kind={kind} className={styles.heading} id={id}>
                {children}
            </Text>
        );
    },
    h5: ({ children }) => {
        const id = extractText(children)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        const { kind, as } = headingConfig[5];
        return (
            <Text as={as} kind={kind} className={styles.heading} id={id}>
                {children}
            </Text>
        );
    },
    h6: ({ children }) => {
        const id = extractText(children)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        const { kind, as } = headingConfig[6];
        return (
            <Text as={as} kind={kind} className={styles.heading} id={id}>
                {children}
            </Text>
        );
    },

    // ── Paragraphs & inline text ─────────────────────────────
    p: ({ children }) => (
        <Text as="p" kind="paragraphMedium" className={styles.paragraph}>
            {children}
        </Text>
    ),
    strong: ({ children }) => (
        <Text as="span" kind="paragraphMedium" weight="semibold">
            {children}
        </Text>
    ),
    em: ({ children }) => (
        <Text as="span" kind="paragraphMedium" fontStyle="italic">
            {children}
        </Text>
    ),
    del: ({ children }) => (
        <span className={styles.strikethrough}>{children}</span>
    ),

    // ── Links & images ───────────────────────────────────────
    a: ({ href, children }) => (
        <StyledLink href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </StyledLink>
    ),
    img: ({ src, alt }) => (
        <span className={styles.imageWrapper}>
            <img
                src={src}
                alt={alt || ''}
                className={styles.image}
                loading="lazy"
            />
        </span>
    ),

    // ── Blockquotes ──────────────────────────────────────────
    blockquote: ({ children }) => (
        <Callout variant="default" icon={null} className={styles.blockquote}>
            {children}
        </Callout>
    ),

    // ── Horizontal rules ─────────────────────────────────────
    hr: () => <hr className={styles.hr} />,

    // ── Lists ────────────────────────────────────────────────
    ul: ({ children, className }) => {
        const isTaskList = className === 'contains-task-list';
        return (
            <ul
                className={clsx(
                    styles.list,
                    styles.unorderedList,
                    isTaskList && styles.taskList,
                )}
            >
                {children}
            </ul>
        );
    },
    ol: ({ children, start }) => (
        <ol className={clsx(styles.list, styles.orderedList)} start={start}>
            {children}
        </ol>
    ),
    li: ({ children, className }) => {
        const isTask = className === 'task-list-item';
        return (
            <li
                className={clsx(styles.listItem, isTask && styles.taskListItem)}
            >
                {children}
            </li>
        );
    },

    // ── Code ─────────────────────────────────────────────────
    code: ({ children, className }) => {
        const languageMatch = className?.match(/language-(\w+)/);
        const isBlock = !!languageMatch;

        if (isBlock) {
            return (
                <div className={styles.codeBlockWrapper}>
                    {languageMatch?.[1] && (
                        <div className={styles.codeLanguage}>
                            <Text as="span" kind="labelXSmall" weight="medium">
                                {languageMatch[1]}
                            </Text>
                        </div>
                    )}
                    <code className={clsx(styles.codeBlock, className)}>
                        {children}
                    </code>
                </div>
            );
        }

        return <code className={styles.inlineCode}>{children}</code>;
    },
    pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,

    // ── Tables ───────────────────────────────────────────────
    table: ({ children }) => (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className={styles.thead}>{children}</thead>,
    tbody: ({ children }) => <tbody className={styles.tbody}>{children}</tbody>,
    tr: ({ children }) => <tr className={styles.tr}>{children}</tr>,
    th: ({ children, style }) => (
        <th className={styles.th} style={style}>
            <Text as="span" kind="labelXSmall" weight="semibold">
                {children}
            </Text>
        </th>
    ),
    td: ({ children, style }) => (
        <td className={styles.td} style={style}>
            {children}
        </td>
    ),

    // ── HTML passthrough elements ────────────────────────────
    details: ({ children }) => {
        // Extract summary and body content
        const childArray = Children.toArray(children);
        let summaryContent: ReactNode = 'Details';
        const bodyContent: ReactNode[] = [];

        for (const child of childArray) {
            if (
                isValidElement<{ children?: ReactNode }>(child) &&
                child.type === 'summary'
            ) {
                summaryContent = child.props.children;
            } else {
                bodyContent.push(child);
            }
        }

        return (
            <Accordion title={summaryContent} kind="card" size="small">
                <div className={styles.accordionBody}>{bodyContent}</div>
            </Accordion>
        );
    },
    summary: () => null, // Handled by details above

    kbd: ({ children }) => <kbd className={styles.kbd}>{children}</kbd>,
    sup: ({ children }) => <sup className={styles.sup}>{children}</sup>,
    sub: ({ children }) => <sub className={styles.sub}>{children}</sub>,
    mark: ({ children }) => <mark className={styles.mark}>{children}</mark>,

    // ── Definition lists (HTML passthrough) ──────────────────
    dl: ({ children }) => <dl className={styles.dl}>{children}</dl>,
    dt: ({ children }) => (
        <dt className={styles.dt}>
            <Text as="span" kind="paragraphMedium" weight="semibold">
                {children}
            </Text>
        </dt>
    ),
    dd: ({ children }) => (
        <dd className={styles.dd}>
            <Text
                as="span"
                kind="paragraphSmall"
                color={pvar('new.colors.contentSecondary')}
            >
                {children}
            </Text>
        </dd>
    ),
};

export type MarkdownProps = {
    children: string;
    className?: string;
};

export const Markdown: FC<MarkdownProps> = ({ children, className }) => (
    <div className={clsx(styles.markdown, className)}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
        >
            {children}
        </ReactMarkdown>
    </div>
);
