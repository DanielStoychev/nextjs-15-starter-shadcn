'use client';

import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { useOnboarding } from './onboarding-provider';
import { Bell, BookOpen, CheckCircle, Circle, CreditCard, Play, Star, Target, Trophy, Users } from 'lucide-react';

type GettingStartedTask = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    completed: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
    onboardingFlow?: string;
};

interface GettingStartedGuideProps {
    onClose?: () => void;
}

export function GettingStartedGuide({ onClose }: GettingStartedGuideProps) {
    const { startFlow, isFlowCompleted } = useOnboarding();
    const [tasks, setTasks] = useState<GettingStartedTask[]>([
        {
            id: 'complete-profile',
            title: 'Complete Your Profile',
            description: 'Add your profile information to personalize your experience.',
            icon: <Users className='h-5 w-5' />,
            completed: false, // This would be checked from user data
            action: {
                label: 'Go to Profile',
                onClick: () => (window.location.href = '/dashboard?tab=profile')
            }
        },
        {
            id: 'take-tour',
            title: 'Take the Platform Tour',
            description: 'Learn how to navigate FootyGames with our guided tour.',
            icon: <BookOpen className='h-5 w-5' />,
            completed: isFlowCompleted('new-user-welcome'),
            action: {
                label: 'Start Tour',
                onClick: () => startFlow('new-user-welcome')
            },
            onboardingFlow: 'new-user-welcome'
        },
        {
            id: 'browse-games',
            title: 'Browse Available Games',
            description: 'Explore our prediction games and find ones that interest you.',
            icon: <Target className='h-5 w-5' />,
            completed: false, // Would check if user has visited games page
            action: {
                label: 'View Games',
                onClick: () => (window.location.href = '/games')
            }
        },
        {
            id: 'join-first-game',
            title: 'Join Your First Game',
            description: 'Make your first prediction and start competing with other players.',
            icon: <Play className='h-5 w-5' />,
            completed: false, // Would check if user has any active entries
            action: {
                label: 'Browse Games',
                onClick: () => (window.location.href = '/games')
            }
        },
        {
            id: 'check-leaderboards',
            title: 'Check the Leaderboards',
            description: 'See how you rank against other players and top performers.',
            icon: <Trophy className='h-5 w-5' />,
            completed: false, // Would check if user has visited leaderboards
            action: {
                label: 'View Leaderboards',
                onClick: () => (window.location.href = '/leaderboards')
            }
        },
        {
            id: 'setup-notifications',
            title: 'Set Up Notifications',
            description: 'Stay updated on game results, deadlines, and winnings.',
            icon: <Bell className='h-5 w-5' />,
            completed: false, // Would check notification preferences
            action: {
                label: 'Notification Settings',
                onClick: () => (window.location.href = '/dashboard?tab=notifications')
            }
        }
    ]);

    const completedTasks = tasks.filter((task) => task.completed).length;
    const progressPercentage = (completedTasks / tasks.length) * 100;

    const markTaskCompleted = (taskId: string) => {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: true } : task)));
    };

    return (
        <Card className='mx-auto w-full max-w-2xl'>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle className='flex items-center gap-2'>
                            <Star className='h-6 w-6 text-yellow-500' />
                            Getting Started with FootyGames
                        </CardTitle>
                        <p className='text-muted-foreground mt-1 text-sm'>
                            Complete these steps to make the most of your experience
                        </p>
                    </div>
                    {onClose && (
                        <Button variant='ghost' size='sm' onClick={onClose}>
                            Close
                        </Button>
                    )}
                </div>

                <div className='mt-4'>
                    <div className='mb-2 flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>Progress</span>
                        <span className='font-medium'>
                            {completedTasks} of {tasks.length} completed
                        </span>
                    </div>
                    <Progress value={progressPercentage} className='h-2' />
                </div>
            </CardHeader>

            <CardContent className='space-y-4'>
                {tasks.map((task, index) => (
                    <div
                        key={task.id}
                        className={`flex items-start gap-4 rounded-lg border p-4 transition-all ${
                            task.completed
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}>
                        <div className='mt-0.5 flex-shrink-0'>
                            {task.completed ? (
                                <CheckCircle className='h-6 w-6 text-green-600' />
                            ) : (
                                <Circle className='h-6 w-6 text-gray-400' />
                            )}
                        </div>

                        <div className='min-w-0 flex-grow'>
                            <div className='mb-1 flex items-center gap-3'>
                                <div className='flex items-center gap-2'>
                                    {task.icon}
                                    <h3
                                        className={`font-medium ${task.completed ? 'text-green-900' : 'text-gray-900'}`}>
                                        {task.title}
                                    </h3>
                                </div>
                                <Badge variant='outline' className='text-xs'>
                                    Step {index + 1}
                                </Badge>
                            </div>

                            <p className={`text-sm ${task.completed ? 'text-green-700' : 'text-gray-600'} mb-3`}>
                                {task.description}
                            </p>

                            {!task.completed && task.action && (
                                <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => {
                                        task.action!.onClick();
                                        // Auto-mark some tasks as completed when action is taken
                                        if (task.id === 'take-tour') {
                                            setTimeout(() => markTaskCompleted(task.id), 1000);
                                        }
                                    }}
                                    className='h-8'>
                                    {task.action.label}
                                </Button>
                            )}

                            {task.completed && (
                                <Badge variant='secondary' className='bg-green-100 text-xs text-green-800'>
                                    ✓ Completed
                                </Badge>
                            )}
                        </div>
                    </div>
                ))}

                {completedTasks === tasks.length && (
                    <div className='rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center'>
                        <Trophy className='mx-auto mb-3 h-12 w-12 text-yellow-500' />
                        <h3 className='mb-2 text-lg font-semibold text-gray-900'>Congratulations! 🎉</h3>
                        <p className='mb-4 text-sm text-gray-600'>
                            You&apos;ve completed all the getting started tasks. You&apos;re now ready to enjoy
                            FootyGames!
                        </p>
                        <Button onClick={() => (window.location.href = '/games')}>Start Playing</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Quick action button for the dashboard
export function GettingStartedQuickAccess() {
    const [showGuide, setShowGuide] = useState(false);

    if (showGuide) {
        return (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                <GettingStartedGuide onClose={() => setShowGuide(false)} />
            </div>
        );
    }

    return (
        <Button onClick={() => setShowGuide(true)} variant='outline' size='sm' className='gap-2'>
            <BookOpen className='h-4 w-4' />
            Getting Started
        </Button>
    );
}
