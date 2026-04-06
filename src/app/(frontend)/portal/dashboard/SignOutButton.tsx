'use client';

import { authClient } from '@lib/auth-client';
import LogoutIcon from '@public/logout.svg';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await authClient.signOut();
            router.push('/portal');
        } catch {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="cursor-pointer disabled:opacity-50"
            style={{ background: 'none', border: 'none', padding: 0 }}
            title="Sign out"
        >
            <LogoutIcon width="20px" />
        </button>
    );
}
