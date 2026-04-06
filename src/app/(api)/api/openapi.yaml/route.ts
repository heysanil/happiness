import { oas } from '@docs/oas';
import { NextResponse } from 'next/server';

export const GET = async () =>
    new NextResponse(oas.getSpecAsYaml(), {
        status: 200,
        headers: {
            'Content-Type': 'text/yaml',
        },
    });
