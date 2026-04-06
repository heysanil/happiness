import { auth } from '@lib/auth';

/**
 * Verifies the request session via better-auth and returns the authenticated
 * user's email address, or null if no valid session exists.
 */
export const authorizePortal = async (req: Request): Promise<string | null> => {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.email) return null;
    return session.user.email;
};
