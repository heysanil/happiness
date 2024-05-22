import { getPage } from '@db/ops/pages/getPage';
import { Text } from 'paris/text';
import { ThanksDialog } from '@frontend/[pageID]/ThanksDialog';
import { listDonations } from '@db/ops/donations/listDonations';
import { desc } from 'drizzle-orm';
import type { Donation, Donor, Page } from '@db/schema';
import { donations } from '@db/schema';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { HappinessConfig } from 'happiness.config';
import layoutStyles from 'src/app/(frontend)/[pageID]/layout.module.scss';
import { clsx } from 'clsx';
import type { Metadata, ResolvingMetadata } from 'next';
import { StoryPage } from '@frontend/[pageID]/StoryPage';
import { SimplePage } from '@frontend/[pageID]/SimplePage';
import LoginIcon from '@public/login.svg';
import { db } from '@db/init';
import { notFound } from 'next/navigation';

dayjs.extend(relativeTime);

export async function generateMetadata(
    { params }: { params: { pageID: string } },
    parent: ResolvingMetadata,
) : Promise<Metadata> {
    const { pageID } = params;
    const page = await getPage(pageID);
    return {
        title: page.title,
        description: page.subtitle || 'Donate now',
        openGraph: {
            images: [page.bannerType === 'image' && page.bannerURL ? page.bannerURL : 'og.jpg'],
        },
        twitter: {
            images: [page.bannerType === 'image' && page.bannerURL ? page.bannerURL : 'og.jpg'],
        },
    };
}

export default async function DonationPage(
    { params }: { params: { pageID: string } },
) {
    const page = await getPage(params.pageID);
    const recentDonations = await listDonations({
        include: {
            donor: true,
        },
        filter: {
            page: page.id,
        },
        limit: 30,
        sort: [desc(donations.createdAt)],
    }) as Array<Donation & { donor: Donor }>;

    if (page.status === 'draft') {
        return notFound();
    }

    const relatedPages: Array<Page> = [];
    // let relatedPages: Array<Page> = [];
    // if (page.showRelatedPages && page.fsProject) {
    //     relatedPages = await db.query.pages.findMany({
    //         where: (columns, { and, eq }) => and(
    //             eq(columns.fsProject, page.fsProject as string),
    //             eq(columns.organizer, page.organizer as string),
    //         ),
    //     });
    // }

    return (
        <>
            <div className={clsx(layoutStyles.navContainer, 'sticky top-0')}>
                <nav
                    className={clsx(
                        layoutStyles.container,
                        page.kind === 'simple' && layoutStyles.simple,
                        layoutStyles.nav,
                        'py-[16px] md:py-[24px] mb-[24px] w-full flex flex-row justify-between items-center',
                    )}
                >
                    <a className="cursor-pointer" href="https://slingshot.fm/?utm_source=happiness" target="_blank" rel="noreferrer">
                        <div className="flex flex-row justify-start items-center gap-3">
                            <img
                                src={HappinessConfig.logoWide || HappinessConfig.logo}
                                alt={HappinessConfig.name}
                                className="h-[24px]"
                            />
                        </div>
                    </a>
                    <a
                        href="/v1/portal"
                        target="_blank"
                        className="cursor-pointer"
                    >
                        <LoginIcon width="20px" />
                    </a>
                </nav>
                <div className={clsx(layoutStyles.headerSeparator, 'w-full h-[1px] absolute bottom-0 left-0')} />
            </div>
            <main>
                <div
                    className={clsx(
                        'w-full grid items-start gap-6 grid-cols-1 md:grid-cols-12 lg:grid-cols-3',
                        layoutStyles.container,
                        page.kind === 'simple' && layoutStyles.simple,
                    )}
                >
                    {page.kind === 'story' && (
                        <StoryPage page={page} recentDonations={recentDonations} />
                    )}
                    {page.kind === 'simple' && (
                        <SimplePage
                            page={page}
                            recentDonations={recentDonations}
                            relatedPages={relatedPages}
                        />
                    )}
                </div>
                <ThanksDialog page={page} />
            </main>
            <footer
                className={clsx(
                    layoutStyles.footerContainer,
                    'pt-8 pb-16 mt-16 relative',
                )}
            >
                <div className={clsx(layoutStyles.footerSeparator, 'w-full h-1 absolute top-0 left-0')} />
                <div
                    className={clsx(
                        layoutStyles.container,
                        page.kind === 'simple' && layoutStyles.simple,
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
                    {!HappinessConfig.hidePoweredByHappiness && (
                        <a href="https://github.com/heysanil/happiness" target="_blank" rel="noreferrer">
                            <Text as="p" kind="paragraphSmall" className="underline underline-offset-4">
                                Powered by Happiness
                            </Text>
                        </a>
                    )}
                </div>
            </footer>
        </>
    );
}
