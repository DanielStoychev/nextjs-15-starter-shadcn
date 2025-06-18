import { NextResponse } from 'next/server';

import { processRaceTo33Goals } from '@/lib/game-logic/processRaceTo33Goals';
import prisma from '@/lib/prisma';

// Assuming this logic will be in a separate file

export async function POST(request: Request) {
    try {
        // This route should ideally be protected by an admin check or a secret key
        // if it's meant to be triggered by a background job or admin panel.
        // For now, it's open for development purposes.

        const { gameInstanceId } = await request.json();

        if (!gameInstanceId) {
            return new NextResponse('Missing gameInstanceId', { status: 400 });
        }

        const result = await processRaceTo33Goals(gameInstanceId);

        return NextResponse.json({ message: 'Race to 33 goals processed successfully', result });
    } catch (error) {
        console.error('Error processing Race to 33 goals:', error);

        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
