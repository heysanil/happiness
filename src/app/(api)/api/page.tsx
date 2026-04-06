import { APIDocs } from '@docs/APIDocs';
import { oas } from '@docs/oas';

const DocsPage = async () => (
    <section className="w-full h-screen">
        <APIDocs spec={oas.getSpecAsJson(undefined, 2)} />
    </section>
);

export default DocsPage;
