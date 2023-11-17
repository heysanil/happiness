import styles from '@frontend/[pageID]/page.module.scss';
import { DonateButton } from '@frontend/[pageID]/DonateButton';
import { ShareButton } from '@frontend/[pageID]/ShareButton';
import type { Page } from '@db/schema';
import type { FC } from 'react';
import { formatCurrency } from 'src/util/formatCurrency';
import { Text } from 'paris/text';
import { HappinessConfig } from 'happiness.config';

export const PageSummary: FC<{ page: Page }> = ({ page }) => (
    <div className="w-full flex flex-col gap-[20px]">
        {page.raised && (
            <div className="flex flex-col gap-2">
                <Text as="h2" kind="paragraphMedium">
                    <Text kind="headingXSmall">{formatCurrency(page.raised, 0, page.currency || 'usd')}</Text>
                    {' '}
                    raised
                    {page.goal && (` of ${formatCurrency(page.goal, 0, page.currency || 'usd')} goal`)}
                </Text>
                {page.goal && (
                    <div
                        className={`h-1 w-full rounded-full ${styles.bgSecondary}`}
                    >
                        <div
                            className={`h-1 rounded-full ${styles.bgAccent}`}
                            style={{ width: `${Math.min(Math.max(Math.round((page.raised / page.goal) * 100), 1), 100)}%` }}
                        />
                    </div>
                )}
            </div>
        )}
        <div className="w-full flex flex-col gap-[8px] mb-3">
            <DonateButton
                projectName={page.fsProject || page.organizer || HappinessConfig.fiscalSponsorName || HappinessConfig.name}
                pageID={page.id}
            />
            <ShareButton page={page} />
        </div>
    </div>
);
