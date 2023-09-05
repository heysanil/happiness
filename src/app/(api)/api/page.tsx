import { oas } from '@docs/oas';
import { APIDocs } from '@docs/APIDocs';

const DocsPage = async () => (
    <section className="w-full h-screen">
        <APIDocs spec={oas.getSpecAsJson(undefined, 2)} />
    </section>
);

export default DocsPage;
