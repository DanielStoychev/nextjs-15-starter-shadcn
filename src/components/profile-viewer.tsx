"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york-v4/ui/avatar';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { useSession } from 'next-auth/react';

interface ProfileViewerProps {
    onEdit: () => void;
}

export function ProfileViewer({ onEdit }: ProfileViewerProps) {
    const { data: session } = useSession();

    const user = session?.user;

    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
                <Button onClick={onEdit} variant="outline">
                    Edit Profile
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className='flex items-center gap-4'>
                    <Avatar className='size-20'>
                        <AvatarImage src={user?.image || 'https://github.com/shadcn.png'} alt='@user_avatar' />
                        <AvatarFallback>{user?.name?.charAt(0) || 'CN'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className='text-lg font-semibold'>{user?.name || 'Guest'}</h3>
                        <p className='text-sm text-muted-foreground'>{user?.email}</p>
                    </div>
                </div>

                {user?.username && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Username</p>
                        <p className="text-lg">{user.username}</p>
                    </div>
                )}

                {user?.bio && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Bio</p>
                        <p className="text-lg">{user.bio}</p>
                    </div>
                )}

                {user?.location && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p className="text-lg">{user.location}</p>
                    </div>
                )}

                {user?.favouriteTeam && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Favourite Team</p>
                        <p className="text-lg">{user.favouriteTeam}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
