import {
    bigint, boolean,
    varchar, mysqlEnum, text, timestamp, mysqlTableCreator, json,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { generateID, Prefixes } from 'src/util/generateID';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { HappinessConfig } from 'happiness.config';
import type { z } from 'zod';

const mysqlTable = mysqlTableCreator((name) => `${HappinessConfig.databaseTablePrefix}_${name}`);

const PagesColumns = {
    id: varchar('id', { length: 20 }).primaryKey().$defaultFn(() => generateID(Prefixes.Page)),
    createdAt: timestamp('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    kind: mysqlEnum('kind', ['simple', 'story']).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    organizer: varchar('organizer', { length: 255 }).notNull().default(HappinessConfig.name),
    organizerPicture: text('organizer_picture'),
    fsProject: varchar('fs_project', { length: 255 }),
    title: varchar('title', { length: 255 }).notNull(),
    subtitle: varchar('subtitle', { length: 255 }),
    story: text('story'),
    bannerType: mysqlEnum('banner_type', ['image', 'embed']),
    bannerURL: text('banner_url'),
    goal: bigint('goal', { mode: 'number' }),
    raised: bigint('raised', { mode: 'number' }),
    currency: mysqlEnum('goal_currency', ['usd']),
    showRelatedPages: boolean('show_related_pages').notNull().default(false),
    hideAmountRaised: boolean('hide_amount_raised').notNull().default(false),
    status: mysqlEnum('status', ['draft', 'published', 'inactive']).notNull().default('published'),
} as const;

export const pages = mysqlTable('pages', PagesColumns);
export const pagesDeleted = mysqlTable('pages_deleted', PagesColumns);

export const DonationsColumns = {
    id: varchar('id', { length: 20 }).primaryKey().$defaultFn(() => generateID(Prefixes.Donation)),
    createdAt: timestamp('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
    pageID: varchar('page_id', { length: 255 }).notNull(),
    donorID: varchar('donor_id', { length: 255 }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull().default(0),
    amountCurrency: mysqlEnum('amount_currency', ['usd']).notNull().default('usd'),
    fee: bigint('fee', { mode: 'number' }).notNull().default(0),
    feeCurrency: mysqlEnum('fee_currency', ['usd']).notNull().default('usd'),
    feeCovered: boolean('fee_covered').notNull().default(false),
    tipAmount: bigint('tip_amount', { mode: 'number' }).notNull().default(0),
    visible: boolean('visible').notNull().default(false),
    message: text('message'),
    externalTransactionProvider: mysqlEnum('external_transaction_provider', ['stripe']),
    externalTransactionID: varchar('external_transaction_id', { length: 255 }).unique(),
} as const;

export const donations = mysqlTable('donations', DonationsColumns);
export const donationsDeleted = mysqlTable('donations_deleted', DonationsColumns);

export const DonorsColumns = {
    id: varchar('id', { length: 20 }).primaryKey().$defaultFn(() => generateID(Prefixes.Donor)),
    createdAt: timestamp('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    company: varchar('company', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    anonymous: boolean('anonymous').notNull().default(false),
} as const;

export const donors = mysqlTable('donors', DonorsColumns);
export const donorsDeleted = mysqlTable('donors_deleted', DonorsColumns);

export const pagesRelations = relations(pages, ({ many }) => ({
    donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
    page: one(pages, { fields: [donations.pageID], references: [pages.id] }),
    donor: one(donors, { fields: [donations.donorID], references: [donors.id] }),
}));

export const donorsRelations = relations(donors, ({ many }) => ({
    donations: many(donations),
}));

export const insertPageSchema = createInsertSchema(pages)
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    });
export const updatePageSchema = insertPageSchema.deepPartial();
export const selectPageSchema = createSelectSchema(pages);

export const insertDonationSchema = createInsertSchema(donations)
    .partial({ id: true })
    .omit({
        // id: true,
        createdAt: true,
        updatedAt: true,
    });
export const updateDonationSchema = insertDonationSchema.deepPartial();
export const selectDonationSchema = createSelectSchema(donations);

export const insertDonorSchema = createInsertSchema(donors)
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    });
export const updateDonorSchema = insertDonorSchema.deepPartial();
export const selectDonorSchema = createSelectSchema(donors);

export type Page = z.infer<typeof selectPageSchema>;
export type Donation = z.infer<typeof selectDonationSchema>;
export type Donor = z.infer<typeof selectDonorSchema>;
