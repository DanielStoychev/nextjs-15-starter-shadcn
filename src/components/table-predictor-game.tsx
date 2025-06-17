'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Label } from '@/registry/new-york-v4/ui/label';

import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Team {
    id: string;
    name: string;
    logoPath: string;
}

interface TablePredictorGameProps {
    gameInstanceId: string;
    // In a real scenario, you'd fetch actual league teams here
    // For now, use dummy data or pass it down
    initialTeams: Team[];
}

const TablePredictorGame: React.FC<TablePredictorGameProps> = ({ gameInstanceId, initialTeams }) => {
    const { data: session } = useSession();
    const [predictedOrder, setPredictedOrder] = useState<Team[]>(initialTeams);
    const [predictedTotalGoals, setPredictedTotalGoals] = useState<number | ''>('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Fetch existing prediction if any
        const fetchPrediction = async () => {
            if (!session?.user?.id || !gameInstanceId) return;

            // This would be an API call to fetch the user's existing prediction
            // For now, simulate it
            // const response = await fetch(`/api/games/table-predictor/prediction?gameInstanceId=${gameInstanceId}`);
            // if (response.ok) {
            //     const data = await response.json();
            //     if (data) {
            //         setPredictedOrder(data.predictedOrder.map((teamId: string) => initialTeams.find(t => t.id === teamId)));
            //         setPredictedTotalGoals(data.predictedTotalGoals);
            //         setHasSubmitted(true);
            //     }
            // }
        };
        fetchPrediction();
    }, [session, gameInstanceId, initialTeams]);

    const moveTeam = (fromIndex: number, toIndex: number) => {
        const updatedOrder = [...predictedOrder];
        const [movedTeam] = updatedOrder.splice(fromIndex, 1);
        updatedOrder.splice(toIndex, 0, movedTeam);
        setPredictedOrder(updatedOrder);
    };

    const handleSubmit = async () => {
        if (!session?.user?.id) {
            toast.error('You must be logged in to submit a prediction.');

            return;
        }
        if (predictedTotalGoals === '' || predictedOrder.length === 0) {
            toast.error('Please complete your prediction before submitting.');

            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/games/table-predictor/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameInstanceId,
                    predictedOrder: predictedOrder.map((team) => team.id),
                    predictedTotalGoals: Number(predictedTotalGoals)
                })
            });

            if (response.ok) {
                toast.success('Prediction submitted successfully!');
                setHasSubmitted(true);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to submit prediction.');
            }
        } catch (error) {
            console.error('Error submitting prediction:', error);
            toast.error('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className='mx-auto my-8 w-full max-w-2xl'>
            <CardHeader className='text-center'>
                <CardTitle className='text-2xl font-bold'>Table Predictor</CardTitle>
                <p className='text-muted-foreground'>Predict the final league table and total goals for the season.</p>
            </CardHeader>
            <CardContent>
                {hasSubmitted ? (
                    <div className='p-4 text-center'>
                        <h3 className='mb-2 text-xl font-semibold'>Prediction Submitted!</h3>
                        <p className='text-muted-foreground'>
                            You have already submitted your prediction for this game.
                        </p>
                        <p className='text-muted-foreground mt-2'>
                            Come back after the season ends to see your score on the leaderboard!
                        </p>
                    </div>
                ) : (
                    <>
                        <div className='mb-6'>
                            <h4 className='mb-2 text-center text-lg font-semibold'>Predict League Order</h4>
                            <p className='text-muted-foreground mb-4 text-center text-sm'>
                                Drag and drop teams to predict their final league position. (For now, use up/down arrows
                                to reorder)
                            </p>
                            <div className='space-y-2'>
                                {predictedOrder.map((team, index) => (
                                    <div
                                        key={team.id}
                                        className='bg-card flex items-center justify-between rounded-md border p-3 shadow-sm'>
                                        <span className='w-8 text-center font-medium'>{index + 1}.</span>
                                        <div className='flex flex-grow items-center'>
                                            {team.logoPath && (
                                                <img src={team.logoPath} alt={team.name} className='mr-3 h-6 w-6' />
                                            )}
                                            <span>{team.name}</span>
                                        </div>
                                        <div className='flex space-x-1'>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={() => moveTeam(index, index - 1)}
                                                disabled={index === 0}>
                                                &#9650; {/* Up arrow */}
                                            </Button>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={() => moveTeam(index, index + 1)}
                                                disabled={index === predictedOrder.length - 1}>
                                                &#9660; {/* Down arrow */}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='mb-6 text-center'>
                            <Label htmlFor='total-goals' className='mb-2 block text-lg font-semibold'>
                                Predict Total Goals in Season
                            </Label>
                            <p className='text-muted-foreground mb-4 text-sm'>
                                Enter your prediction for the total number of goals scored across all matches in the
                                season.
                            </p>
                            <Input
                                id='total-goals'
                                type='number'
                                placeholder='e.g., 1000'
                                value={predictedTotalGoals}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPredictedTotalGoals(Number(e.target.value) || '')
                                }
                                className='mx-auto w-full max-w-xs text-center'
                            />
                        </div>

                        <div className='text-center'>
                            <Button onClick={handleSubmit} disabled={isLoading} className='w-full max-w-xs'>
                                {isLoading ? 'Submitting...' : 'Submit Prediction'}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default TablePredictorGame;
