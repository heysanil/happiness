// ---------------------------------------------------------------------------
// Shared E2E test constants
// ---------------------------------------------------------------------------

/** Base URL of the running Next.js application under test. */
export const BASE_URL = 'http://localhost:3000';

/** Root API key used for authenticated admin requests. */
export const API_KEY =
    process.env.HAPPINESS_ROOT_API_KEY || 'test-root-api-key-e2e';

// -- Page slugs -------------------------------------------------------------

export const SIMPLE_PAGE_SLUG = 'e2e-test-simple';
export const STORY_PAGE_SLUG = 'e2e-test-story';

// -- Donor info -------------------------------------------------------------

export const TEST_DONOR_EMAIL = 'e2e-donor@test.local';
export const TEST_DONOR_FIRST = 'E2E';
export const TEST_DONOR_LAST = 'Donor';

// -- MailPit ----------------------------------------------------------------

export const MAILPIT_URL = 'http://localhost:8025';

// -- Deterministic entity IDs -----------------------------------------------
// These follow the project's ID convention: 2-char prefix + "_" + 13 alphanum
// but are human-readable so tests can assert exact values.

export const SIMPLE_PAGE_ID = 'pg_e2esimple001';
export const STORY_PAGE_ID = 'pg_e2estory0001';
export const TEST_DONOR_ID = 'dr_e2edonor0001';
export const TEST_DONATION_ID = 'dn_e2edonation1';
