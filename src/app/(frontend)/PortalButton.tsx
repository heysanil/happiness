'use client';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'paris/button';

const ArrowRightIcon = ({ size }: { size: number }) => (
    <FontAwesomeIcon width={`${size}px`} icon={faArrowRight} />
);

export const PortalButton = () => (
    <Button
        render={(props) => <a href="/portal" {...props} />}
        endEnhancer={ArrowRightIcon}
    >
        Donor login
    </Button>
);
