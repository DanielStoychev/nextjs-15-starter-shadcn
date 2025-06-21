import { NextResponse } from 'next/server';

import { getFixturesByDateRange, getRoundFixtures } from '@/lib/sportmonks-api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const roundId = searchParams.get('roundId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const teamId = searchParams.get('teamId');
        const leagues = searchParams.get('leagues');

        if (roundId) {
            const response = await getRoundFixtures(Number(roundId));

            return NextResponse.json(response.data);
        } else if (startDate && endDate) {
            const params: { team_id?: number; leagues?: string; include?: string } = {
                include: 'participants,scores,state'
            };
            if (teamId) params.team_id = Number(teamId);
            if (leagues) params.leagues = leagues;

            const response = await getFixturesByDateRange(startDate, endDate, params);

            return NextResponse.json(response.data);
        } else {
            return NextResponse.json(
                { error: 'Missing required parameters: either roundId or startDate and endDate' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error fetching fixtures from SportMonks:', error);

        return NextResponse.json(
            { error: 'Failed to fetch fixtures', details: (error as Error).message },
            { status: 500 }
        );
    }
}
