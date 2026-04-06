'use client';

import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'paris/button';

const DownloadIcon = ({ size }: { size: number }) => (
    <FontAwesomeIcon width={`${size}px`} icon={faDownload} />
);

export function ReceiptButton({ donationId }: { donationId: string }) {
    return (
        <Button
            kind="tertiary"
            shape="circle"
            size="small"
            render={(props) => (
                <a
                    href={`/receipts/${donationId}`}
                    target="_blank"
                    rel="noreferrer"
                    {...props}
                />
            )}
            startEnhancer={DownloadIcon}
        >
            Download receipt
        </Button>
    );
}
