import { NextResponse } from 'next/server';
import { oas } from '@docs/oas';

export const GET = async () => new NextResponse(oas.getSpecAsYaml(), {
    status: 200,
    headers: {
        'Content-Type': 'text/yaml',
    },
});
