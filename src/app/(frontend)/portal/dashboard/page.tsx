import { listDonations } from '@db/ops/donations/listDonations';
import { getDonor } from '@db/ops/donors/getDonor';
import { getPage } from '@db/ops/pages/getPage';
import { donations } from '@db/schema';
import { auth } from '@lib/auth';
import { stripe } from '@lib/stripe/index';
import { clsx } from 'clsx';
import { desc } from 'drizzle-orm';
import { HappinessConfig } from 'happiness.config';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Text } from 'paris/text';
import layoutStyles from 'src/app/(frontend)/[pageID]/layout.module.scss';
import type Stripe from 'stripe';
import { CancelSubscriptionButton } from './CancelSubscriptionButton';
import { ReceiptButton } from './ReceiptButton';
import { SignOutButton } from './SignOutButton';

export const dynamic = 'force-dynamic';

function formatCurrency(amountInCents: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amountInCents / 100);
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export default async function DashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
        redirect('/portal');
    }

    const donorEmail = session.user.email;

    // Attempt to find the donor; they may have an account but no donations yet
    let donor: Awaited<ReturnType<typeof getDonor>> | null = null;
    try {
        donor = await getDonor(donorEmail);
    } catch {
        // Donor not found in the database — show empty state
    }

    // Fetch donations if we have a donor
    let donationsWithPage: any[] = [];
    if (donor) {
        donationsWithPage = await listDonations({
            filter: { donor: donor.id },
            include: { page: true },
            sort: [desc(donations.createdAt)],
        });
    }

    // Fetch active subscriptions from Stripe
    let subscriptions: Stripe.Subscription[] = [];
    try {
        const customers = await stripe.customers.list({
            email: donorEmail,
            limit: 1,
        });
        console.log(
            `[portal] Stripe customer lookup for ${donorEmail}: ${customers.data.length} found`,
        );
        if (customers.data.length > 0) {
            const subs = await stripe.subscriptions.list({
                customer: customers.data[0].id,
                status: 'active',
                expand: ['data.items.data.price'],
            });
            console.log(
                `[portal] Active subscriptions for ${customers.data[0].id}: ${subs.data.length}`,
            );
            subscriptions = subs.data;
        }
    } catch (err) {
        console.error('[portal] Stripe subscription lookup failed:', err);
    }

    // Resolve page names for subscriptions from their metadata pageID
    const subPageNames = new Map<string, string>();
    const uniquePageIDs = [
        ...new Set(
            subscriptions
                .map((s) => s.metadata?.pageID)
                .filter((id): id is string => !!id),
        ),
    ];
    await Promise.all(
        uniquePageIDs.map(async (pageID) => {
            try {
                const p = await getPage(pageID);
                subPageNames.set(pageID, p.name);
            } catch {
                // Page not found — skip
            }
        }),
    );

    return (
        <div className="flex flex-col min-h-screen gap-6">
            {/* Nav — matches donation page nav */}
            <div className={clsx(layoutStyles.navContainer, 'sticky top-0')}>
                <nav
                    className={clsx(
                        layoutStyles.container,
                        layoutStyles.nav,
                        'py-[16px] md:py-[24px] w-full flex flex-row justify-between items-center',
                    )}
                >
                    <a
                        className="cursor-pointer"
                        href="https://slingshot.fm/?utm_source=happiness"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <div className="flex flex-row justify-start items-center gap-3">
                            <img
                                src={
                                    HappinessConfig.logoWide ||
                                    HappinessConfig.logo
                                }
                                alt={HappinessConfig.name}
                                className="h-[24px]"
                            />
                        </div>
                    </a>
                    <div className="flex items-center gap-3">
                        <Text
                            kind="paragraphSmall"
                            as="span"
                            style={{
                                color: 'var(--pte-colors-contentSecondary, #6b7280)',
                            }}
                        >
                            {donorEmail}
                        </Text>
                        <SignOutButton />
                    </div>
                </nav>
                <div
                    className={clsx(
                        layoutStyles.headerSeparator,
                        'w-full h-[1px] absolute bottom-0 left-0',
                    )}
                />
            </div>

            {/* Main content */}
            <main
                className={clsx(
                    layoutStyles.container,
                    'flex-1 flex flex-col gap-8 pt-6 pb-10',
                )}
            >
                {/* Welcome section */}
                <div className="flex flex-col gap-1">
                    <Text kind="headingSmall" as="h1">
                        Welcome back
                        {donor?.firstName ? `, ${donor.firstName}` : ''}
                    </Text>
                    <Text
                        kind="paragraphSmall"
                        as="p"
                        style={{
                            color: 'var(--pte-colors-contentSecondary, #6b7280)',
                        }}
                    >
                        {donor
                            ? "Here's your donation history and active subscriptions."
                            : 'No donations found for this email address yet.'}
                    </Text>
                </div>

                {/* Active subscriptions */}
                {subscriptions.length > 0 && (
                    <section className="flex flex-col gap-4">
                        <Text kind="headingXSmall" as="h2">
                            Active Subscriptions
                        </Text>
                        <div className="flex flex-col gap-3">
                            {subscriptions.map((sub) => {
                                const item = sub.items.data[0];
                                const price = item?.price;
                                const amount = price?.unit_amount
                                    ? formatCurrency(
                                          price.unit_amount,
                                          price.currency,
                                      )
                                    : 'N/A';
                                const interval =
                                    price?.recurring?.interval ?? 'month';
                                const nextCharge = new Date(
                                    sub.current_period_end * 1000,
                                );
                                const productName =
                                    (sub.metadata?.pageID &&
                                        subPageNames.get(
                                            sub.metadata.pageID,
                                        )) ||
                                    price?.nickname ||
                                    'Monthly donation';

                                return (
                                    <div
                                        key={sub.id}
                                        className="flex items-center justify-between p-4 rounded-lg"
                                        style={{
                                            border: '1px solid var(--pte-colors-borderOpaque, #e5e5e5)',
                                        }}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <Text
                                                kind="paragraphSmall"
                                                weight="semibold"
                                                as="span"
                                            >
                                                {productName}
                                            </Text>
                                            <Text
                                                kind="paragraphXSmall"
                                                as="span"
                                                style={{
                                                    color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                                }}
                                            >
                                                {amount}/{interval}
                                            </Text>
                                        </div>
                                        {sub.cancel_at_period_end ? (
                                            <Text
                                                kind="paragraphSmall"
                                                as="span"
                                                style={{
                                                    color: 'var(--pte-colors-contentNegative, #dc2626)',
                                                }}
                                            >
                                                Ends{' '}
                                                {new Intl.DateTimeFormat(
                                                    'en-US',
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    },
                                                ).format(nextCharge)}
                                            </Text>
                                        ) : (
                                            <CancelSubscriptionButton
                                                subscriptionId={sub.id}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Donation history */}
                {donor && (
                    <section className="flex flex-col gap-4">
                        <Text kind="headingXSmall" as="h2">
                            Donation History
                        </Text>

                        {donationsWithPage.length === 0 ? (
                            <div
                                className="p-6 rounded-lg text-center"
                                style={{
                                    border: '1px solid var(--pte-colors-borderOpaque, #e5e5e5)',
                                }}
                            >
                                <Text
                                    kind="paragraphSmall"
                                    as="p"
                                    style={{
                                        color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                    }}
                                >
                                    No donations yet.
                                </Text>
                            </div>
                        ) : (
                            <div
                                className="rounded-lg overflow-hidden"
                                style={{
                                    border: '1px solid var(--pte-colors-borderOpaque, #e5e5e5)',
                                }}
                            >
                                <table className="w-full text-left">
                                    <thead>
                                        <tr
                                            style={{
                                                borderBottom:
                                                    '1px solid var(--pte-colors-borderOpaque, #e5e5e5)',
                                                background:
                                                    'var(--pte-colors-backgroundSecondary, #f9fafb)',
                                            }}
                                        >
                                            <th className="px-4 py-3">
                                                <Text
                                                    kind="labelXSmall"
                                                    as="span"
                                                    style={{
                                                        color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                                    }}
                                                >
                                                    Campaign
                                                </Text>
                                            </th>
                                            <th className="px-4 py-3">
                                                <Text
                                                    kind="labelXSmall"
                                                    as="span"
                                                    style={{
                                                        color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                                    }}
                                                >
                                                    Amount
                                                </Text>
                                            </th>
                                            <th className="px-4 py-3">
                                                <Text
                                                    kind="labelXSmall"
                                                    as="span"
                                                    style={{
                                                        color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                                    }}
                                                >
                                                    Date
                                                </Text>
                                            </th>
                                            <th className="px-4 py-3">
                                                <Text
                                                    kind="labelXSmall"
                                                    as="span"
                                                    style={{
                                                        color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                                    }}
                                                >
                                                    Receipt
                                                </Text>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donationsWithPage.map((donation) => {
                                            const page =
                                                'page' in donation
                                                    ? (donation.page as {
                                                          name: string;
                                                      })
                                                    : null;

                                            return (
                                                <tr
                                                    key={donation.id}
                                                    style={{
                                                        borderBottom:
                                                            '1px solid var(--pte-colors-borderOpaque, #e5e5e5)',
                                                    }}
                                                >
                                                    <td className="px-4 py-3">
                                                        <Text
                                                            kind="paragraphXSmall"
                                                            as="span"
                                                        >
                                                            {page?.name ??
                                                                'Unknown'}
                                                        </Text>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Text
                                                            kind="paragraphXSmall"
                                                            as="span"
                                                            style={
                                                                donation.refunded
                                                                    ? {
                                                                          textDecoration:
                                                                              'line-through',
                                                                          color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                                                      }
                                                                    : undefined
                                                            }
                                                        >
                                                            {formatCurrency(
                                                                donation.amount,
                                                                donation.amountCurrency,
                                                            )}
                                                        </Text>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Text
                                                            kind="paragraphXSmall"
                                                            as="span"
                                                            style={{
                                                                color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                                            }}
                                                        >
                                                            {formatDate(
                                                                donation.createdAt,
                                                            )}
                                                        </Text>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {!donation.refunded ? (
                                                            <ReceiptButton
                                                                donationId={
                                                                    donation.id
                                                                }
                                                            />
                                                        ) : (
                                                            <Text
                                                                kind="paragraphXSmall"
                                                                as="span"
                                                                style={{
                                                                    color: 'var(--pte-colors-contentSecondary, #6b7280)',
                                                                }}
                                                            >
                                                                Refunded
                                                            </Text>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}
