'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { GameInstance } from '@/generated/prisma';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { useSession } from 'next-auth/react';

interface Fixture {
    id: number;
    name: string;
    starting_at: string;
    participants: Array<{
        id: number;
        name: string;
        image_path: string;
        meta: {
            location: 'home' | 'away';
        };
    }>;
    scores: Array<{
        score: {
            home: number;
            away: number;
        };
        description: string;
        type: 'FT' | 'HT' | 'ET' | 'PEN';
    }>;
}

interface LastManStandingGameProps {
    gameInstance: GameInstance;
    fixtures: Fixture[];
    currentRoundId: string | null;
    isSeasonFinished: boolean;
}

export function LastManStandingGame({
    gameInstance,
    fixtures,
    currentRoundId,
    isSeasonFinished
}: LastManStandingGameProps) {
    const { data: session } = useSession();
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [formattedDates, setFormattedDates] = useState<Record<number, string>>({});
    const [previouslyPickedTeamIds, setPreviouslyPickedTeamIds] = useState<string[]>([]);
    const [isLoadingPicks, setIsLoadingPicks] = useState<boolean>(true);
    const [pickPercentages, setPickPercentages] = useState<
        Array<{ teamId: string; teamName: string; percentage: number }>
    >([]);
    const [isLoadingPercentages, setIsLoadingPercentages] = useState<boolean>(false);

    useEffect(() => {
        // Fetch previously picked teams by the user for this game instance
        const fetchPickedTeams = async () => {
            if (session?.user?.id && gameInstance.id) {
                setIsLoadingPicks(true);
                try {
                    const response = await fetch(
                        `/api/games/last-man-standing/user-picks?gameInstanceId=${gameInstance.id}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setPreviouslyPickedTeamIds(data.pickedTeamIds || []);
                    } else {
                        console.error('Failed to fetch previously picked teams');
                        setPreviouslyPickedTeamIds([]); // Set to empty on error
                    }
                } catch (error) {
                    console.error('Error fetching previously picked teams:', error);
                    setPreviouslyPickedTeamIds([]); // Set to empty on error
                } finally {
                    setIsLoadingPicks(false);
                }
            } else {
                setPreviouslyPickedTeamIds([]);
                setIsLoadingPicks(false);
            }
        };

        fetchPickedTeams();
    }, [session, gameInstance.id]);

    useEffect(() => {
        // Fetch pick percentages for the current round
        const fetchPickPercentages = async () => {
            if (currentRoundId && gameInstance.id) {
                setIsLoadingPercentages(true);
                try {
                    const response = await fetch(
                        `/api/games/last-man-standing/pick-percentages?roundId=${currentRoundId}&gameInstanceId=${gameInstance.id}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setPickPercentages(data.percentages || []);
                    } else {
                        console.error('Failed to fetch pick percentages');
                        setPickPercentages([]);
                    }
                } catch (error) {
                    console.error('Error fetching pick percentages:', error);
                    setPickPercentages([]);
                } finally {
                    setIsLoadingPercentages(false);
                }
            } else {
                setPickPercentages([]);
            }
        };

        // Only fetch percentages if currentRoundId and gameInstance.id are available
        // Add condition here if percentages should only be shown when "in play"
        if (currentRoundId && gameInstance.id) {
            fetchPickPercentages();
        }
    }, [currentRoundId, gameInstance.id]);

    useEffect(() => {
        // Format dates on the client side after hydration
        const dates: Record<number, string> = {};
        fixtures.forEach((fixture) => {
            dates[fixture.id] = new Date(fixture.starting_at).toLocaleString();
        });
        setFormattedDates(dates);
    }, [fixtures]);

    const handlePickTeam = (teamId: number) => {
        if (previouslyPickedTeamIds.includes(String(teamId))) {
            alert('You have already picked this team in this game cycle.');

            return;
        }
        setSelectedTeamId(teamId);
    };

    const handleSubmitPick = async () => {
        if (!session?.user?.id || !selectedTeamId || !currentRoundId) {
            alert('Please log in, select a team, and ensure the current round is available.');

            return;
        }

        try {
            const response = await fetch('/api/games/last-man-standing/pick', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameInstanceId: gameInstance.id,
                    roundId: currentRoundId,
                    pickedTeamId: selectedTeamId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit pick');
            }

            alert('Pick submitted successfully!');
            // Optionally, refresh state or redirect, e.g., refetch picked teams
            // fetchPickedTeams(); // Or better, update state directly if API confirms success
            setSelectedTeamId(null); // Reset selection
            // Add the just picked team to previouslyPickedTeamIds to immediately disable it
            setPreviouslyPickedTeamIds((prev) => [...prev, String(selectedTeamId)]);
        } catch (err) {
            alert(`Error submitting pick: ${(err as Error).message}`);
        }
    };

    if (isSeasonFinished) {
        return (
            <p>
                The current Premier League season has finished. Please wait for the next season to start or select a
                different game.
            </p>
        );
    }

    if (!currentRoundId) {
        return <p>No current or upcoming round found for Last Man Standing. Please check back later.</p>;
    }

    if (fixtures.length === 0) {
        return <p>No upcoming fixtures found for this round.</p>;
    }

    if (isLoadingPicks) {
        return <p>Loading your previous picks...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-center'>Make Your Pick for This Week</CardTitle>
            </CardHeader>
            <CardContent>
                <p className='mb-4 text-center'>Select one team you predict will win their match this week.</p>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    {fixtures.map((fixture) => (
                        <div key={fixture.id} className='rounded-md border p-4'>
                            <h3 className='mb-2 text-center font-semibold'>
                                {fixture.participants.find((p) => p.meta.location === 'home')?.name} vs{' '}
                                {fixture.participants.find((p) => p.meta.location === 'away')?.name}
                            </h3>
                            <p className='text-muted-foreground text-center text-sm'>
                                Kick-off: {formattedDates[fixture.id] || new Date(fixture.starting_at).toISOString()}
                            </p>
                            <div className='mt-4 flex justify-around'>
                                {fixture.participants.map((participant) => {
                                    const isTeamDisabled = previouslyPickedTeamIds.includes(String(participant.id));
                                    const percentageData = pickPercentages.find(
                                        (p) => p.teamId === String(participant.id)
                                    );

                                    return (
                                        <div
                                            key={participant.id}
                                            onClick={() => !isTeamDisabled && handlePickTeam(participant.id)}
                                            className={`flex h-auto flex-col items-center rounded-md border p-2 transition-colors ${
                                                isTeamDisabled
                                                    ? 'bg-muted cursor-not-allowed opacity-50'
                                                    : 'hover:bg-accent cursor-pointer'
                                            } ${
                                                selectedTeamId === participant.id && !isTeamDisabled
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isTeamDisabled
                                                      ? ''
                                                      : 'bg-background text-foreground'
                                            }`}>
                                            {participant.image_path && (
                                                <Image
                                                    src={participant.image_path}
                                                    alt={participant.name}
                                                    width={40}
                                                    height={40}
                                                    className='mb-1'
                                                />
                                            )}
                                            <span>{participant.name}</span>
                                            {percentageData && (
                                                <span className='text-muted-foreground mt-1 text-xs'>
                                                    ({percentageData.percentage}%)
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <Button onClick={handleSubmitPick} disabled={!selectedTeamId} className='mt-6'>
                    Submit Pick
                </Button>
            </CardContent>
        </Card>
    );
}
