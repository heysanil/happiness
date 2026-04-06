'use client';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'paris/button';

const ArrowRightIcon = ({ size }: { size: number }) => (
    <FontAwesomeIcon width={`${size}px`} icon={faArrowRight} />
);

export const PortalButton = ({ href }: { href: string }) => (
    <Button
        render={(props) => (
            <a href={href} target="_blank" rel="noreferrer" {...props} />
        )}
        endEnhancer={ArrowRightIcon}
    >
        Donor login
    </Button>
);
