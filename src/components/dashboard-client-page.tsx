'use client';

import { useState } from 'react';

import ActivityFeed from '@/components/dashboard/activity-feed';
import GameRecommendations from '@/components/dashboard/game-recommendations';
import PersonalizedStats from '@/components/dashboard/personalized-stats';
import GameStatusNotification from '@/components/game-status-notification';
import { MyGamesTable } from '@/components/my-games-table';
import { GettingStartedQuickAccess, OnboardingTriggers } from '@/components/onboarding';
import { ProfileViewer } from '@/components/profile-viewer';
import { ProfileEditForm } from '@/components/user-profile-form';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';

interface DashboardClientPageProps {
    session: Session | null;
}

export function DashboardClientPage({ session }: DashboardClientPageProps) {
    if (!session) {
        // This case should ideally be handled by the server component redirect,
        // but as a fallback or for client-side navigation, we can show a message.
        return (
            <main className='flex min-h-[calc(100vh-14rem)] flex-col items-center p-8'>
                <h1 className='mb-8 text-4xl font-bold'>Access Denied</h1>
                <p className='mb-4 text-lg text-gray-500'>Please sign in to view the dashboard.</p>
                <Button onClick={() => signOut()}>Sign In</Button>
            </main>
        );
    }

    return (
        <main className='flex min-h-[calc(100vh-14rem)] flex-col items-center p-8' data-onboarding='dashboard'>
            <div className='mb-8 flex w-full max-w-4xl items-center justify-between'>
                <h1 className='text-4xl font-bold'>User Dashboard</h1>
                <div className='flex gap-2'>
                    <GettingStartedQuickAccess />
                    <OnboardingTriggers.WelcomeTour variant='button' size='sm' />
                </div>
            </div>

            <Card className='w-full max-w-4xl'>
                <CardHeader>
                    <CardTitle>Welcome, {session.user?.name || session.user?.email}!</CardTitle>
                    <CardDescription>Manage your competitions and profile here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue='overview' className='w-full'>
                        <TabsList className='grid w-full grid-cols-3'>
                            <TabsTrigger value='overview'>Overview</TabsTrigger>
                            <TabsTrigger value='my-games'>My Games</TabsTrigger>
                            <TabsTrigger value='profile'>Profile</TabsTrigger>
                        </TabsList>{' '}
                        <TabsContent value='overview' className='p-4'>
                            <div className='space-y-6'>
                                {/* Personalized Stats */}
                                <PersonalizedStats session={session} />

                                {/* Game Recommendations */}
                                <GameRecommendations session={session} />

                                {/* Activity Feed */}
                                <ActivityFeed session={session} />
                            </div>
                        </TabsContent>
                        <TabsContent value='my-games' className='p-4'>
                            <h3 className='mb-4 text-2xl font-semibold'>My Games</h3>
                            <MyGamesTable />
                        </TabsContent>
                        <TabsContent value='profile' className='p-4'>
                            <ProfileSection />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    );
}

function ProfileSection() {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <>
            <h3 className='mb-4 text-2xl font-semibold'>Profile Settings</h3>
            {isEditing ? (
                <ProfileEditForm onCancel={() => setIsEditing(false)} onSuccess={() => setIsEditing(false)} />
            ) : (
                <ProfileViewer onEdit={() => setIsEditing(true)} />
            )}
        </>
    );
}
