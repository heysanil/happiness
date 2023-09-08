import { getPage } from '@db/ops/pages/getPage';
import { Text } from 'paris/text';
import { Card } from 'paris/card';
import { Banner } from 'src/app/(frontend)/[pageID]/Banner';
import styles from '@frontend/[pageID]/StoryPage.module.scss';
import ReactMarkdown from 'react-markdown';
import { formatCurrency } from 'src/util/formatCurrency';
import { ThanksDialog } from '@frontend/[pageID]/ThanksDialog';
import { listDonations } from '@db/ops/donations/listDonations';
import { desc } from 'drizzle-orm';
import type { Donor } from '@db/schema';
import { donations } from '@db/schema';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import SparkMD5 from 'spark-md5';
import { HappinessConfig } from 'happiness.config';
import layoutStyles from 'src/app/(frontend)/[pageID]/layout.module.scss';
import { clsx } from 'clsx';
import { PageSummary } from '@frontend/[pageID]/PageSummary';
import type { Metadata, ResolvingMetadata } from 'next';

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
            images: ['og.jpg'],
        },
        twitter: {
            images: ['og.jpg'],
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
    });
    return (
        <>
            <div
                className={clsx(
                    'w-full grid items-start gap-6 grid-cols-1 md:grid-cols-12 lg:grid-cols-3',
                    layoutStyles.container,
                )}
            >
                <div className="w-full flex flex-col gap-2 col-span-full">
                    <Text as="h1" kind="displaySmall">
                        {page.title}
                    </Text>
                    <Text as="h1" kind="paragraphLarge">
                        {page.subtitle}
                    </Text>
                </div>
                <div className="md:hidden">
                    <PageSummary page={page} />
                </div>
                <div className="flex flex-col gap-8 md:col-span-7 lg:col-span-2">
                    {page.bannerType && page.bannerURL && (
                        <div className={`${styles.shallowPopup} rounded-[8px] overflow-clip`}>
                            <Banner
                                kind={page.bannerType}
                                url={page.bannerURL}
                                alt={`Banner for ${page.title}`}
                            />
                        </div>
                    )}
                    {page.story && (
                        <ReactMarkdown className={styles.story}>
                            {page.story}
                        </ReactMarkdown>
                    )}
                    <hr className={styles.divider} />
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col gap-2">
                            <Text as="h2" kind="labelSmall">Organized by</Text>
                            <Text as="h3" kind="headingSmall">{page.organizer}</Text>
                        </div>
                        <div className="flex flex-col gap-2 text-right items-end">
                            <Text as="h2" kind="labelSmall">Raising for</Text>
                            <Text as="h3" kind="headingSmall">{page.fsProject || HappinessConfig.fiscalSponsorName || HappinessConfig.name}</Text>
                        </div>
                    </div>
                    <hr className={styles.divider} />
                    <div className="flex flex-col gap-4">
                        {recentDonations.length > 0 ? (<Text as="h2" kind="labelMedium">Recent supporters</Text>) : (<></>)}
                        <div className="flex flex-col gap-4">
                            {recentDonations.map((donation) => (
                                <Card
                                    kind="flat"
                                    key={donation.id}
                                    className="flex flex-row gap-4 items-start"
                                    style={{ padding: '20px' }}
                                >
                                    <div className="w-[47px] h-[47px] shrink-0 rounded-full bg-gray-200">
                                        <img
                                            src={donation.visible ? `https://www.gravatar.com/avatar/${SparkMD5.hash((donation.donor as Donor).email)}?s=64&d=${encodeURIComponent('https://fast.slingshot.fm/sling/static/profile.png')}` : 'https://fast.slingshot.fm/sling/static/profile.png'}
                                            alt="Donor avatar"
                                            className="w-full h-full rounded-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Text as="p" kind="headingXXSmall">
                                            {donation.visible ? `${(donation.donor as Donor).firstName} ${(donation.donor as Donor).lastName.charAt(0)}.` : 'Anonymous'}
                                        </Text>
                                        <Text as="p" kind="paragraphSmall">
                                            {formatCurrency(donation.amount, 0, donation.amountCurrency || 'usd')}
                                            {' · '}
                                            {dayjs(donation.createdAt).fromNow()}
                                        </Text>
                                        {donation.message && (
                                            <Text as="p" kind="paragraphMedium">
                                                {donation.message}
                                            </Text>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
                <Card className="sticky top-4 w-full hidden md:block md:col-span-5 lg:col-span-1">
                    <div className="flex flex-col gap-[20px] w-full p-[20px]">
                        <PageSummary page={page} />
                        <div className="w-full flex flex-col gap-4">
                            {recentDonations.slice(0, 3).map((donation) => (
                                <div key={donation.id} className="flex flex-row gap-4 items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-200">
                                        <img
                                            src={donation.visible ? `https://www.gravatar.com/avatar/${SparkMD5.hash((donation.donor as Donor).email)}?s=64&d=${encodeURIComponent('https://fast.slingshot.fm/sling/static/profile.png')}` : 'https://fast.slingshot.fm/sling/static/profile.png'}
                                            alt="Donor avatar"
                                            className="w-full h-full rounded-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Text as="p" kind="paragraphMedium">
                                            {donation.visible ? `${(donation.donor as Donor).firstName} ${(donation.donor as Donor).lastName.charAt(0)}.` : 'Anonymous'}
                                        </Text>
                                        <Text as="p" kind="paragraphSmall">
                                            <strong>{formatCurrency(donation.amount, 0, donation.amountCurrency || 'usd')}</strong>
                                            {' · '}
                                            {dayjs(donation.createdAt).fromNow()}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
            <ThanksDialog page={page} />
        </>
    );
}
