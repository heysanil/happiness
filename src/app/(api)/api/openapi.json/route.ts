import { oas } from '@docs/oas';
import { NextResponse } from 'next/server';

export const GET = async () => NextResponse.json(oas.getSpec());
