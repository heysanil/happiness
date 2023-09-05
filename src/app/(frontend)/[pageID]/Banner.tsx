import type { FC } from 'react';

export type BannerProps = {
    kind: 'image' | 'embed';
    url: string;
    alt: string;
};

export const Banner: FC<BannerProps> = ({
    kind,
    url,
    alt,
}) => (
    <>
        {kind === 'image' && (
            <img
                src={url}
                className="w-full"
                alt={alt}
            />
        )}
        {kind === 'embed' && (
            <iframe
                title={alt}
                src={url}
                className="w-full aspect-video"
            />
        )}
    </>
);
