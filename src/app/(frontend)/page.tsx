import { Text } from 'paris/text';
import { HappinessConfig } from 'happiness.config';
import { PortalButton } from 'src/app/(frontend)/PortalButton';

export default async function Home() {
    return (
        <main className="w-full h-screen flex flex-col justify-center items-center text-center gap-6">
            <div className="flex flex-col justify-center items-center">
                <img src={HappinessConfig.logo} className="w-16 h-16 mb-4" alt={`${HappinessConfig.name} logo`} />
                <Text as="h1" kind="displaySmall">
                    {HappinessConfig.name}
                </Text>
            </div>
            <PortalButton href="/v1/portal" />
        </main>
    );
}
