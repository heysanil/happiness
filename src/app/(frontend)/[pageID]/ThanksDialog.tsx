'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Dialog } from 'paris/dialog';
import type { Page } from '@db/schema';
import { Text } from 'paris/text';
import { Button } from 'paris/button';
import { HappinessConfig } from 'happiness.config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { share } from '@frontend/[pageID]/share';

const ShareIcon = ({ size }: { size: number }) => <FontAwesomeIcon width={size - 2} icon={faArrowUpRightFromSquare} />;

export const ThanksDialog: FC<{
    page: Page,
}> = ({
    page,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const [thanks, setThanks] = useState('' as string);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const { searchParams } = new URL(window.location.href);
            const name = searchParams.get('thanks');
            if (name) {
                setThanks(name);
                setIsOpen(true);
            }
        }
    }, []);

    return (
        <Dialog
            isOpen={isOpen}
            title={`Thanks, ${thanks}!`}
            onClose={() => setIsOpen(false)}
        >
            <Text as="p" kind="paragraphMedium">
                Your donation to
                {' '}
                <strong>{page.organizer}</strong>
                {' '}
                has been processed. You should receive an email receipt shortly.
            </Text>
            <Text as="p" kind="paragraphMedium">
                Want to increase your impact even more? Share your donation with your friends and family to help.
            </Text>
            <div className="w-full flex justify-end gap-2">
                <Button
                    kind="tertiary"
                    onClick={() => {
                        setIsOpen(false);
                        if (typeof window !== 'undefined') {
                            window.history.replaceState({}, '', window.location.pathname);
                        }
                    }}
                >
                    Close
                </Button>
                <Button
                    endEnhancer={ShareIcon}
                    onClick={async () => {
                        await share(page);
                    }}
                >
                    Share
                </Button>
            </div>
        </Dialog>
    );
};
