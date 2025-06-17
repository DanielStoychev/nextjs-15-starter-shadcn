import { NextResponse } from 'next/server';

import { getSeasonRounds } from '@/lib/sportmonks-api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get('seasonId');

        if (!seasonId) {
            return NextResponse.json({ error: 'Missing seasonId parameter' }, { status: 400 });
        }

        const response = await getSeasonRounds(Number(seasonId));

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching rounds from SportMonks:', error);

        return NextResponse.json(
            { error: 'Failed to fetch rounds', details: (error as Error).message },
            { status: 500 }
        );
    }
}
