import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Text } from 'paris/text';
import styles from 'src/app/(frontend)/[pageID]/layout.module.scss';
import { HappinessConfig } from 'happiness.config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons';

export default function PageLayout({ children }: {
    children: ReactNode,
}) {
    return (
        <>
            <nav
                className={clsx(
                    styles.container,
                    styles.nav,
                    'py-[24px] mb-[24px] w-full flex flex-row justify-between items-center',
                )}
            >
                <a href="/">
                    <div className="flex flex-row justify-start items-center gap-3">
                        <img
                            src={HappinessConfig.logo}
                            alt={HappinessConfig.name}
                            height="32px"
                            width="32px"
                        />
                    </div>
                </a>
                <a
                    href="/v1/portal"
                    target="_blank"
                >
                    <FontAwesomeIcon icon={faArrowRightToBracket} width={16} />
                </a>
            </nav>
            <section>{children}</section>
            <footer
                className={clsx(
                    styles.footerContainer,
                    'pt-8 pb-16 mt-16',
                )}
            >
                <div
                    className={clsx(
                        styles.container,
                        'flex flex-row justify-between items-center text-neutral-500',
                    )}
                >
                    <Text as="p" kind="paragraphSmall">
                        ©
                        {' '}
                        {new Date().getFullYear()}
                        {' '}
                        {HappinessConfig.name}
                        . All rights reserved.
                    </Text>
                    <a href="https://github.com/heysanil/happiness" target="_blank" rel="noreferrer">
                        <Text as="p" kind="paragraphSmall" className="underline underline-offset-4">
                            Powered by Happiness
                        </Text>
                    </a>
                </div>
            </footer>
        </>
    );
}
