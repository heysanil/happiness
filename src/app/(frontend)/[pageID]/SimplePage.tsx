import { Fragment } from 'react';
import type { FC } from 'react';
import type { Donation, Donor, Page } from '@db/schema';
import clsx from 'clsx';
import { Banner } from '@frontend/[pageID]/Banner';
import { Avatar } from 'src/components/Avatar';
import { Text } from 'paris/text';
import { pvar } from 'paris/theme';
import { DonateButton } from '@frontend/[pageID]/DonateButton';
import { ShareButton } from '@frontend/[pageID]/ShareButton';
import { HappinessConfig } from 'happiness.config';
import { formatCurrency } from 'src/util/formatCurrency';
import ReactMarkdown from 'react-markdown';
import SparkMD5 from 'spark-md5';

const RECENT_DONATION_COUNT = 5;

const Spacer: FC<{
    hideBelowMd?: boolean,
}> = ({
    hideBelowMd = false,
}) => (
    <div
        className={clsx(
            'w-full h-[1px]',
            hideBelowMd && 'hidden md:block',
        )}
        style={{ backgroundColor: pvar('colors.borderOpaque') }}
    />
);

export const SimplePage: FC<{
    page: Page,
    recentDonations: Array<Donation & { donor: Donor }>,
    relatedPages?: Page[],
}> = ({
    page,
    recentDonations,
    relatedPages = [],
}) => (
    <>
        <div className="col-span-full w-full flex flex-col gap-[30px]">
            {page.bannerType && page.bannerURL && (
                <div className="flex flex-col subtlePopup w-full rounded-[8px] overflow-clip">
                    <Banner
                        kind={page.bannerType}
                        url={page.bannerURL}
                        alt={`Banner for ${page.title}`}
                    />
                </div>
            )}

            {/* Organizer, page title, buttons */}
            <div className="w-full flex flex-col gap-5">
                {/* Organizer name + picture */}
                <div className="flex flex-row gap-3">
                    {page.organizerPicture && (
                        <Avatar
                            src={page.organizerPicture}
                            alt={`Picture of ${page.organizer}`}
                            width={24}
                            verified
                        />
                    )}
                    <Text as="h2" kind="headingXXSmall">
                        {page.organizer}
                    </Text>
                </div>

                {/* Page title + buttons */}
                <div className="w-full flex flex-col md:flex-row gap-[30px] md:gap-4 justify-start md:justify-between items-start md:items-center">
                    <Text as="h1" kind="displayMedium" className="hidden md:block">
                        {page.title}
                    </Text>
                    <Text as="h1" kind="displaySmall" className="md:hidden">
                        {page.title}
                    </Text>

                    <div className="w-full md:w-[280px] flex flex-col md:flex-row gap-3">
                        <DonateButton
                            projectName={page.fsProject || page.organizer || HappinessConfig.fiscalSponsorName || HappinessConfig.name}
                            pageID={page.id}
                            className="w-full"
                        />
                        <ShareButton
                            page={page}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Divider (only on medium+) */}
            <Spacer hideBelowMd />

            {/* Mission and recent donors */}
            <div className="w-full gap-[30px] flex flex-col md:flex-row">
                {/* Mission */}
                <div className="w-full flex flex-col gap-5">
                    <Text key="subtitle" as="h3" kind="headingXXSmall">
                        {page.subtitle}
                    </Text>
                    {page.story && (
                        <ReactMarkdown key="story">
                            {page.story}
                        </ReactMarkdown>
                    )}
                    {HappinessConfig.fiscalSponsorMode && (
                        <Text key="fiscal" as="p" kind="paragraphXSmall">
                            {page.fsProject || page.title || HappinessConfig.fiscalSponsorName || HappinessConfig.name}
                            {' '}
                            is a fiscally-sponsored project of
                            {' '}
                            {HappinessConfig.fiscalSponsorName}
                            , a 501(c)(3) non-profit organization (EIN:
                            {' '}
                            {HappinessConfig.fiscalSponsorEIN}
                            ). Contributions are tax-deductible to the extent permitted by law.
                        </Text>
                    )}
                </div>

                {/* Recent donors */}
                {recentDonations.length > 0 && (
                    <div className="w-full flex flex-col gap-5">
                        <Text as="h3" kind="headingXXSmall">
                            Recent donors
                        </Text>
                        <div className="w-full flex flex-col gap-3">
                            {recentDonations.slice(0, RECENT_DONATION_COUNT).map((donation, index) => (
                                <Fragment key={`donation-${donation.id}-fragment`}>
                                    <div key={`donation-${donation.id}`} className="flex flex-col gap-3">
                                        <div className="w-full flex flex-row justify-between items-center">
                                            <div className="flex flex-row gap-3 items-center">
                                                <div className="w-[24px] h-[24px] shrink-0 rounded-full bg-gray-200">
                                                    <img
                                                        src={donation.visible ? `https://www.gravatar.com/avatar/${SparkMD5.hash((donation.donor as Donor).email)}?s=64&d=${encodeURIComponent('https://fast.slingshot.fm/sling/static/profile.png')}` : 'https://fast.slingshot.fm/sling/static/profile.png'}
                                                        alt="Donor avatar"
                                                        className="w-full h-full rounded-full"
                                                    />
                                                </div>
                                                <Text as="p" kind="paragraphMedium" weight="medium">
                                                    {donation.visible ? `${(donation.donor as Donor).firstName} ${(donation.donor as Donor).lastName.charAt(0)}.` : 'Anonymous'}
                                                </Text>
                                            </div>
                                            <Text as="p" kind="paragraphMedium" weight="medium">
                                                {formatCurrency(donation.amount, 0, donation.amountCurrency || 'usd')}
                                                {/* {' · '} */}
                                                {/* {dayjs(donation.createdAt).fromNow()} */}
                                            </Text>
                                        </div>
                                        {donation.message && (
                                            <Text as="p" kind="paragraphXSmall">
                                                {donation.message}
                                            </Text>
                                        )}
                                    </div>
                                    {index < (Math.min(RECENT_DONATION_COUNT, recentDonations.length) - 1) && (
                                        <Spacer key={`spacer-${donation.id}`} />
                                    )}
                                </Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Other pages by the same organizer + FS project */}
            {/* {relatedPages.length > 0 && ( */}
            {/*    <> */}
            {/*        /!* Divider (only on medium+) *!/ */}
            {/*        <Spacer key="related-pages-spacer" hideBelowMd /> */}

            {/*        <div className="w-full flex flex-col gap-5"> */}
            {/*            <Text kind="headingXXSmall"> */}
            {/*                Recent fundraisers */}
            {/*            </Text> */}

            {/*            <div className="w-full overflow-y-scroll"> */}
            {/*                <div */}
            {/*                    className="flex flex-row gap-4" */}
            {/*                    style={{ width: `calc(244px * ${relatedPages.length})` }} */}
            {/*                > */}
            {/*                    {relatedPages.map((pg) => ( */}
            {/*                        <Link */}
            {/*                            key={`related-page-${pg.id}`} */}
            {/*                            href={`/${pg.slug}`} */}
            {/*                            className="flex-shrink-0 w-[228px]" */}
            {/*                        > */}
            {/*                            <Tilt> */}
            {/*                                <Card */}
            {/*                                    className={clsx(styles.pageCard, 'cursor-pointer w-[228px]')} */}
            {/*                                > */}
            {/*                                    {pg.bannerType === 'image' && pg.bannerURL && ( */}
            {/*                                        <img */}
            {/*                                            src={pg.bannerURL as string} */}
            {/*                                            alt={pg.title} */}
            {/*                                            className="w-full h-[80px] object-cover" */}
            {/*                                        /> */}
            {/*                                    )} */}
            {/*                                    <div className="p-4 flex flex-col gap-3"> */}
            {/*                                        <Text as="h3" kind="paragraphSmall" weight="medium"> */}
            {/*                                            {pg.title} */}
            {/*                                        </Text> */}
            {/*                                        /!* <Text as="p" kind="paragraphXSmall"> *!/ */}
            {/*                                        /!*    <span className="font-medium">{formatCurrency(pg.raised || 1, 0)}</span> *!/ */}
            {/*                                        /!*    {' '} *!/ */}
            {/*                                        /!*    raised *!/ */}
            {/*                                        /!* </Text> *!/ */}
            {/*                                    </div> */}
            {/*                                </Card> */}
            {/*                            </Tilt> */}
            {/*                        </Link> */}
            {/*                    ))} */}
            {/*                </div> */}
            {/*            </div> */}
            {/*        </div> */}
            {/*    </> */}
            {/* )} */}
        </div>
    </>
);
