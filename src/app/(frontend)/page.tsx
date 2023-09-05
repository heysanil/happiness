import { Text } from 'paris/text';
import { HappinessConfig } from 'happiness.config';

export default function Home() {
    return (
        <main className="w-full h-screen flex flex-col justify-center items-center text-center">
            <Text as="h1" kind="displaySmall">
                {HappinessConfig.name}
            </Text>
        </main>
    );
}
