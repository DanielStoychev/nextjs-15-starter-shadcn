'use client';

import { useState } from 'react';

import { useToast } from '@/components/ui/use-toast';
// This path seems correct based on environment_details
import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Calendar } from '@/registry/new-york-v4/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/new-york-v4/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Assuming GameInstanceStatus enum values from Prisma schema
const gameInstanceStatuses = ['DRAFT', 'OPEN', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

const formSchema = z
    .object({
        gameId: z.string().min(1, 'Game selection is required.'),
        name: z.string().min(3, 'Instance name must be at least 3 characters.'),
        startDate: z.date({ required_error: 'Start date is required.' }),
        entryFee: z.coerce.number().min(0, 'Entry fee cannot be negative.'),
        prizePool: z.coerce.number().min(0, 'Prize pool cannot be negative.'),
        numberOfRounds: z.coerce.number().int().positive().optional().nullable(),
        endDate: z.date().optional().nullable(),
        status: z.enum(gameInstanceStatuses)
    })
    .refine(
        (data) => {
            if (!data.numberOfRounds && !data.endDate) {
                return false;
            }

            return true;
        },
        {
            message: 'Either Number of Rounds or End Date must be provided.',
            path: ['endDate'] // Show error near endDate or a general form error
        }
    );

type GameInstanceFormValues = z.infer<typeof formSchema>;

interface Game {
    id: string; // Changed from cuid
    name: string;
    slug: string; // Added slug, removed gameType
}

interface CreateGameInstanceFormProps {
    games: Game[];
    onInstanceCreated?: () => void; // Optional callback
}

export function CreateGameInstanceForm({ games, onInstanceCreated }: CreateGameInstanceFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<GameInstanceFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            entryFee: 0,
            prizePool: 0,
            status: 'DRAFT',
            numberOfRounds: undefined,
            endDate: undefined
        }
    });

    async function onSubmit(data: GameInstanceFormValues) {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                startDate: data.startDate.toISOString(),
                endDate: data.endDate ? data.endDate.toISOString() : undefined,
                numberOfRounds: data.numberOfRounds ? Number(data.numberOfRounds) : undefined
            };

            const response = await fetch('/api/admin/game-instances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create game instance.');
            }

            toast({
                title: 'Success!',
                description: 'Game instance created successfully.'
            });
            form.reset();
            if (onInstanceCreated) {
                onInstanceCreated();
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className='w-full'>
            <CardHeader>
                <CardTitle>Create New Game Instance</CardTitle>
                <CardDescription>Fill in the details to create a new game instance.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                        <FormField
                            control={form.control}
                            name='gameId'
                            render={({ field }: { field: ControllerRenderProps<GameInstanceFormValues, 'gameId'> }) => (
                                <FormItem>
                                    <FormLabel>Game</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder='Select a game type' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {games.map((game) => (
                                                <SelectItem key={game.id} value={game.id}>
                                                    {game.name} ({game.slug})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }: { field: ControllerRenderProps<GameInstanceFormValues, 'name'> }) => (
                                <FormItem>
                                    <FormLabel>Instance Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder='E.g., Premier League 24/25 Week 1' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='startDate'
                            render={({
                                field
                            }: {
                                field: ControllerRenderProps<GameInstanceFormValues, 'startDate'>;
                            }) => (
                                <FormItem className='flex flex-col'>
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-[240px] pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}>
                                                    {field.value ? (
                                                        format(field.value, 'PPP')
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-auto p-0' align='start'>
                                            <Calendar
                                                mode='single'
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date: Date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                                } // Disable past dates
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='numberOfRounds'
                            render={({
                                field
                            }: {
                                field: ControllerRenderProps<GameInstanceFormValues, 'numberOfRounds'>;
                            }) => (
                                <FormItem>
                                    <FormLabel>Number of Rounds (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='number'
                                            placeholder='E.g., 5'
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                field.onChange(e.target.value === '' ? null : Number(e.target.value))
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        For games like Last Man Standing. If set, End Date will be calculated.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='endDate'
                            render={({
                                field
                            }: {
                                field: ControllerRenderProps<GameInstanceFormValues, 'endDate'>;
                            }) => (
                                <FormItem className='flex flex-col'>
                                    <FormLabel>End Date (Optional)</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-[240px] pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}>
                                                    {field.value ? (
                                                        format(field.value, 'PPP')
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-auto p-0' align='start'>
                                            <Calendar
                                                mode='single'
                                                selected={field.value ?? undefined}
                                                onSelect={field.onChange}
                                                disabled={(date: Date) =>
                                                    (form.getValues('startDate') &&
                                                        date < form.getValues('startDate')) ||
                                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>Required if Number of Rounds is not set.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='entryFee'
                            render={({
                                field
                            }: {
                                field: ControllerRenderProps<GameInstanceFormValues, 'entryFee'>;
                            }) => (
                                <FormItem>
                                    <FormLabel>Entry Fee (£)</FormLabel>
                                    <FormControl>
                                        <Input type='number' step='0.01' placeholder='0.00' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='prizePool'
                            render={({
                                field
                            }: {
                                field: ControllerRenderProps<GameInstanceFormValues, 'prizePool'>;
                            }) => (
                                <FormItem>
                                    <FormLabel>Prize Pool (£)</FormLabel>
                                    <FormControl>
                                        <Input type='number' step='0.01' placeholder='0.00' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='status'
                            render={({ field }: { field: ControllerRenderProps<GameInstanceFormValues, 'status'> }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder='Select status' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {gameInstanceStatuses.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type='submit' disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Game Instance'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
