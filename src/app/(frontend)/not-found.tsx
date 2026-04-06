import Link from 'next/link';
import { Button } from 'paris/button';
import { Text } from 'paris/text';

import styles from './error.module.scss';

export default function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Text as="h1" kind="display">
                    404
                </Text>
                <div className={styles.textContent}>
                    <Text as="h2" kind="headingLarge">
                        Page not found
                    </Text>
                    <Text as="p" kind="paragraphSmall" color="secondary">
                        The page you are looking for does not exist or has been
                        moved.
                    </Text>
                </div>
                <div className={styles.actions}>
                    <Link href="/">
                        <Button>Go home</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
