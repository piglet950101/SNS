import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// -----------------------------------------------------------------------------
// users
// -----------------------------------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: varchar('clerk_id', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
    ageVerifiedAt: timestamp('age_verified_at'),
    antisocialAttestedAt: timestamp('antisocial_attested_at'),
    termsAcceptedAt: timestamp('terms_accepted_at'),
    termsVersion: varchar('terms_version', { length: 20 }),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    clerkIdx: uniqueIndex('users_clerk_idx').on(t.clerkId),
    emailIdx: index('users_email_idx').on(t.email),
  }),
)

// -----------------------------------------------------------------------------
// stores
// -----------------------------------------------------------------------------
export const stores = pgTable(
  'stores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    businessType: varchar('business_type', { length: 50 }).notNull(),
    area: varchar('area', { length: 100 }).notNull(),

    // X (Phase 1)
    xAccessToken: text('x_access_token'),
    xRefreshToken: text('x_refresh_token'),
    xUsername: varchar('x_username', { length: 50 }),
    xConnectedAt: timestamp('x_connected_at'),
    xTokenExpiresAt: timestamp('x_token_expires_at'),

    // Google (Phase 2 — nullable, reserved)
    googleAccessToken: text('google_access_token'),
    googleRefreshToken: text('google_refresh_token'),
    googleAccountId: varchar('google_account_id', { length: 100 }),
    googleConnectedAt: timestamp('google_connected_at'),
    googleTokenExpiresAt: timestamp('google_token_expires_at'),

    // WordPress (Phase 3 — nullable, reserved)
    wpSiteUrl: varchar('wp_site_url', { length: 500 }),
    wpUsername: varchar('wp_username', { length: 100 }),
    wpAppPassword: text('wp_app_password'),
    wpConnectedAt: timestamp('wp_connected_at'),

    // Instagram (Phase 4 — nullable, reserved)
    igAccessToken: text('ig_access_token'),
    igAccountId: varchar('ig_account_id', { length: 100 }),
    igConnectedAt: timestamp('ig_connected_at'),
    igTokenExpiresAt: timestamp('ig_token_expires_at'),

    // Token health monitoring
    tokenRefreshFailedAt: timestamp('token_refresh_failed_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('stores_user_idx').on(t.userId),
  }),
)

// -----------------------------------------------------------------------------
// posts
// -----------------------------------------------------------------------------
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    imageUrls: jsonb('image_urls').$type<string[]>().notNull().default([]),
    hint: text('hint'),
    generatedForX: text('generated_for_x'),
    generatedForGoogle: text('generated_for_google'),
    generatedForWp: jsonb('generated_for_wp').$type<{ title: string; body: string } | null>(),
    generatedForInstagram: text('generated_for_instagram'),
    editedForX: text('edited_for_x'),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    isTrial: boolean('is_trial').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    publishedAt: timestamp('published_at'),
  },
  (t) => ({
    userIdx: index('posts_user_idx').on(t.userId),
    storeIdx: index('posts_store_idx').on(t.storeId),
    createdIdx: index('posts_created_idx').on(t.createdAt),
  }),
)

// -----------------------------------------------------------------------------
// post_results — one row per platform attempt
// -----------------------------------------------------------------------------
export const postResults = pgTable(
  'post_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    platform: varchar('platform', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    externalId: varchar('external_id', { length: 200 }),
    externalUrl: text('external_url'),
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),
    attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
  },
  (t) => ({
    postIdx: index('post_results_post_idx').on(t.postId),
    platformIdx: index('post_results_platform_idx').on(t.platform),
  }),
)

// -----------------------------------------------------------------------------
// subscriptions — one active row per user
// -----------------------------------------------------------------------------
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }).notNull().unique(),
    plan: varchar('plan', { length: 20 }).notNull(),
    billingInterval: varchar('billing_interval', { length: 10 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    userIdx: uniqueIndex('subscriptions_user_idx').on(t.userId),
  }),
)

// -----------------------------------------------------------------------------
// usage_logs — per-user per-month counters
// -----------------------------------------------------------------------------
export const usageLogs = pgTable(
  'usage_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }),
    yearMonth: varchar('year_month', { length: 7 }).notNull(),
    generateCount: integer('generate_count').notNull().default(0),
    postCount: integer('post_count').notNull().default(0),
    overageCount: integer('overage_count').notNull().default(0),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    userMonthIdx: uniqueIndex('usage_logs_user_month_idx').on(t.userId, t.yearMonth),
  }),
)

// -----------------------------------------------------------------------------
// data_retention_cleanup — audit trail for deletions/log expiry
// -----------------------------------------------------------------------------
export const dataRetentionCleanup = pgTable('data_retention_cleanup', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetTable: varchar('target_table', { length: 50 }).notNull(),
  targetId: uuid('target_id').notNull(),
  action: varchar('action', { length: 30 }).notNull(),
  ranAt: timestamp('ran_at').notNull().defaultNow(),
})

// -----------------------------------------------------------------------------
// Type helpers
// -----------------------------------------------------------------------------
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Store = typeof stores.$inferSelect
export type NewStore = typeof stores.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type PostResult = typeof postResults.$inferSelect
export type NewPostResult = typeof postResults.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type UsageLog = typeof usageLogs.$inferSelect
export type NewUsageLog = typeof usageLogs.$inferInsert
