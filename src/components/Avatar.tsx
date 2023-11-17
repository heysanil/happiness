import type { FC } from 'react';
import Frame from '@public/avatar-ring.svg';
import Verified from '@public/verified.svg';

export const Avatar: FC<{
    src: string;
    alt: string;
    width?: number;
    verified?: boolean;
}> = ({
    src,
    alt,
    width = 32,
    verified = false,
}) => (
    <div className="relative aspect-square">
        <img
            src={src}
            alt={alt}
            className="aspect-square rounded-full"
            width={width}
        />

        <Frame className="absolute top-0 left-0 w-full h-full" />
        {verified && (
            <Verified className="absolute bottom-[-1px] right-[-1px] w-2/5 h-2/5" />
        )}
    </div>
);
