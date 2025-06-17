import { NextResponse } from 'next/server';

import { getLeaguesByCountry } from '@/lib/sportmonks-api';

// Use the new API utility

export async function GET() {
    try {
        // Assuming England's country ID is 46. This might need to be verified.
        const ENGLAND_COUNTRY_ID = 46;
        const response = await getLeaguesByCountry(ENGLAND_COUNTRY_ID, 'currentSeason');

        // Ensure response.data is an array before filtering
        const allLeagues = Array.isArray(response.data) ? response.data : [];

        // Filter for the four English leagues: Premier League, Championship, League One, League Two
        const englishLeagues = allLeagues.filter((league: any) =>
            ['Premier League', 'Championship', 'League One', 'League Two'].includes(league.name)
        );

        return NextResponse.json(englishLeagues);
    } catch (error) {
        console.error('Error fetching English leagues from SportMonks:', error);

        return NextResponse.json(
            { error: 'Failed to fetch English leagues', details: (error as Error).message },
            { status: 500 }
        );
    }
}
