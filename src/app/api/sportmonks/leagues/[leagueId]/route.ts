import { NextResponse } from 'next/server';

import { getLeagueDetails } from '@/lib/sportmonks-api';

export async function GET(request: Request, { params }: { params: { leagueId: string } }) {
    try {
        const { leagueId } = await params;
        const { searchParams } = new URL(request.url);
        const include = searchParams.get('include');

        if (!leagueId) {
            return NextResponse.json({ error: 'Missing leagueId parameter' }, { status: 400 });
        }

        const response = await getLeagueDetails(Number(leagueId), include || undefined);

        return NextResponse.json(response); // Return the full response including data, message, etc.
    } catch (error) {
        console.error('Error fetching league details from SportMonks:', error);

        return NextResponse.json(
            { error: 'Failed to fetch league details', details: (error as Error).message },
            { status: 500 }
        );
    }
}
