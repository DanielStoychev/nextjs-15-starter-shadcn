"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/registry/new-york-v4/ui/form';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Textarea } from '@/registry/new-york-v4/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york-v4/ui/avatar';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/registry/new-york-v4/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSession } from 'next-auth/react'; // Import useSession

const premierLeagueTeams = [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton & Hove Albion',
    'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town', 'Leicester City',
    'Liverpool', 'Manchester City', 'Manchester United', 'Newcastle United',
    'Nottingham Forest', 'Southampton', 'Tottenham Hotspur', 'West Ham United', 'Wolverhampton Wanderers'
];

const FormSchema = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.'
    }),
    email: z
        .string({
            required_error: 'Email is required.'
        })
        .email({ message: 'Invalid email address.' }),
    username: z.string().min(2, {
        message: 'Username must be at least 2 characters.'
    }).max(30, {
        message: 'Username must not be longer than 30 characters.'
    }).optional(),
    bio: z.string().max(160, {
        message: 'Bio must not be longer than 160 characters.'
    }).min(4, {
        message: 'Bio must be at least 4 characters.'
    }).optional(),
    location: z.string().optional(),
    favouriteTeam: z.string().optional(),
});

interface ProfileEditFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export function ProfileEditForm({ onCancel, onSuccess }: ProfileEditFormProps) {
    const { data: session, update } = useSession(); // Get session data and update function

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: session?.user?.name || '',
            email: session?.user?.email || '',
            username: session?.user?.username || '',
            bio: session?.user?.bio || '',
            location: session?.user?.location || '',
            favouriteTeam: session?.user?.favouriteTeam || '',
        }
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile.');
            }

            // Update the session on the client side to reflect changes
            await update();
            onSuccess(); // Call onSuccess to switch back to viewer mode

            toast('Profile updated successfully!', {
                description: 'Your profile details have been saved.',
            });
        } catch (error: any) {
            toast('Error updating profile:', {
                description: error.message || 'An unexpected error occurred.',
                // Sonner does not support a 'variant' property directly.
                // For destructive styling, you might need to use custom components or CSS.
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='grid w-full max-w-sm gap-6'>
                <div className='flex items-center gap-4'>
                    <Avatar className='size-20'>
                        <AvatarImage src={session?.user?.image || 'https://github.com/shadcn.png'} alt='@user_avatar' />
                        <AvatarFallback>{session?.user?.name?.charAt(0) || 'CN'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className='text-lg font-semibold'>{session?.user?.name || 'Guest'}</h3>
                        <p className='text-sm text-muted-foreground'>{session?.user?.email}</p>
                    </div>
                </div>
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder='Your Name' {...field} />
                            </FormControl>
                            <FormDescription>This is your public display name.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='username'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder='@yourusername' {...field} />
                            </FormControl>
                            <FormDescription>This is your unique username.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder='your@email.com' {...field} type='email' />
                            </FormControl>
                            <FormDescription>Your email address.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='bio'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder='Tell us a little about yourself'
                                    className='resize-none'
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                You can @mention other users and organizations to link to them.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='location'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <Input placeholder='Your City, Country' {...field} />
                            </FormControl>
                            <FormDescription>Where are you located?</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='favouriteTeam'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Favourite Team</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Select your favourite Premier League team' />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Premier League Teams</SelectLabel>
                                        {premierLeagueTeams.map((team) => (
                                            <SelectItem key={team} value={team}>
                                                {team}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Select your favourite Premier League team.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex gap-2">
                    <Button type='submit'>Update Profile</Button>
                    <Button type='button' variant='outline' onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Form>
    );
}
