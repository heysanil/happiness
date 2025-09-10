import type { FC } from 'react';
import { clsx } from 'clsx';
import styles from './Banner.module.scss';

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
            <div
                style={{
                    // @ts-expect-error - Allow passing in custom CSS variables
                    '--banner-image-url': `url(${url})`,
                }}
                className={clsx(
                    styles.bannerImagePreview,
                    'w-full max-w-full aspect-video rounded-[8px] flex justify-center items-center relative overflow-hidden',
                )}
            >
                <img
                    src={url}
                    alt={alt}
                    className="max-w-full max-h-full object-contain z-[1]"
                />
            </div>
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
