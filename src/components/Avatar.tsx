import type { FC } from 'react';
import { pvar } from 'paris/theme';
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
    <div
        className="relative shrink-0 bg-black rounded-full flex justify-center items-center"
        style={{
            width: `${width}px`,
            height: `${width}px`,
            background: pvar('tokens.colors.gradientTeal'),
        }}
    >
        <img
            src={src}
            alt={alt}
            className="rounded-full shrink-0"
            style={{ width: `${width - 2}px`, height: `${width - 2}px` }}
        />
        {verified && (
            <Verified className="absolute bottom-[-1px] right-[-1px] w-2/5 h-2/5 shrink-0" />
        )}
    </div>
);
