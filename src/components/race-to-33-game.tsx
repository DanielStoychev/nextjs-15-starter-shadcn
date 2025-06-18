'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { useSession } from 'next-auth/react';

interface Team {
    sportMonksId: number;
    name: string;
    logoPath: string | null;
}

interface RaceTo33Assignment {
    id: string;
    userGameEntryId: string;
    assignedTeamIds: string[]; // Changed from number[] to string[]
    cumulativeGoals: number;
    createdAt: string;
    updatedAt: string;
    assignedTeams: Team[]; // Populated by the API
}

interface RaceTo33GameProps {
    gameInstanceId: string;
}

export function RaceTo33Game({ gameInstanceId }: RaceTo33GameProps) {
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const [assignment, setAssignment] = useState<RaceTo33Assignment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigningTeams, setIsAssigningTeams] = useState(false);

    const fetchAssignment = async () => {
        if (status !== 'authenticated' || !gameInstanceId) {
            setIsLoading(false);

            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/games/race-to-33/status?gameInstanceId=${gameInstanceId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setAssignment(null); // No assignment yet
                } else {
                    throw new Error(`Failed to fetch assignment: ${response.statusText}`);
                }
            } else {
                const data: RaceTo33Assignment = await response.json();
                setAssignment(data);
            }
        } catch (error: any) {
            console.error('Error fetching Race to 33 assignment:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load game status.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignment();
    }, [status, gameInstanceId]);

    const handleAssignTeams = async () => {
        if (status !== 'authenticated') {
            toast({
                title: 'Unauthorized',
                description: 'Please log in to assign teams.',
                variant: 'destructive'
            });

            return;
        }

        setIsAssigningTeams(true);
        try {
            const response = await fetch('/api/games/race-to-33/assign-teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameInstanceId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to assign teams.');
            }

            toast({
                title: 'Success',
                description: 'Teams assigned successfully!'
            });
            fetchAssignment(); // Refresh assignment
        } catch (error: any) {
            console.error('Error assigning teams:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to assign teams.',
                variant: 'destructive'
            });
        } finally {
            setIsAssigningTeams(false);
        }
    };

    if (isLoading) {
        return <div className='py-8 text-center'>Loading Race to 33 game...</div>;
    }

    if (status === 'unauthenticated') {
        return <div className='py-8 text-center'>Please log in to play Race to 33.</div>;
    }

    return (
        <Card className='mx-auto w-full max-w-2xl'>
            <CardHeader>
                <CardTitle>Race to 33</CardTitle>
            </CardHeader>
            <CardContent>
                {!assignment ? (
                    <div className='text-center'>
                        <p className='mb-4'>You have not yet been assigned teams for this game instance.</p>
                        <Button onClick={handleAssignTeams} disabled={isAssigningTeams}>
                            {isAssigningTeams ? 'Assigning Teams...' : 'Assign My Teams'}
                        </Button>
                    </div>
                ) : (
                    <div>
                        <h3 className='mb-4 text-lg font-semibold'>Your Assigned Teams:</h3>
                        <div className='mb-6 grid grid-cols-2 gap-4'>
                            {assignment.assignedTeams.map((team) => (
                                <div key={team.sportMonksId} className='flex items-center space-x-2'>
                                    {team.logoPath && (
                                        <Image
                                            src={team.logoPath}
                                            alt={team.name}
                                            width={40}
                                            height={40}
                                            className='rounded-full'
                                        />
                                    )}
                                    <span>{team.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className='text-center text-2xl font-bold'>
                            Cumulative Goals: {assignment.cumulativeGoals} / 33
                        </div>
                        {assignment.cumulativeGoals >= 33 && (
                            <p className='mt-4 text-center font-bold text-green-600'>
                                {assignment.cumulativeGoals === 33
                                    ? 'Congratulations! You reached 33 goals!'
                                    : 'You exceeded 33 goals!'}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
