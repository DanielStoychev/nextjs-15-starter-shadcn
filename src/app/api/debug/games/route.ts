import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const games = await prisma.game.findMany({
            include: {
                gameInstances: true
            }
        });

        return NextResponse.json(games, { status: 200 });
    } catch (error) {
        console.error('Error fetching debug games data:', error);

        return NextResponse.json(
            { message: 'Failed to fetch debug games data', details: (error as Error).message },
            { status: 500 }
        );
    }
}