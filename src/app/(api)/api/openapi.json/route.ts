import { NextResponse } from 'next/server';
import { oas } from '@docs/oas';

export const GET = async () => NextResponse.json(oas.getSpec());
