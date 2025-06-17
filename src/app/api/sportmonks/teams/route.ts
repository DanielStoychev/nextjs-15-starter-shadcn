import { NextResponse } from 'next/server';

import { getSeasonTeams } from '@/lib/sportmonks-api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get('seasonId');

        if (!seasonId) {
            return NextResponse.json({ error: 'Missing seasonId parameter' }, { status: 400 });
        }

        const response = await getSeasonTeams(Number(seasonId));

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching teams from SportMonks:', error);

        return NextResponse.json(
            { error: 'Failed to fetch teams', details: (error as Error).message },
            { status: 500 }
        );
    }
}
