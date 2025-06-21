'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/registry/new-york-v4/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';

import { CheckCircle, Clock, Play, RefreshCw, Settings, XCircle } from 'lucide-react';

interface StatusControlsProps {
    gameInstanceId: string;
    currentStatus: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

const statusOptions = [
    { value: 'PENDING', label: 'Pending', icon: Clock, color: 'default' as const },
    { value: 'ACTIVE', label: 'Active', icon: Play, color: 'default' as const },
    { value: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: 'secondary' as const },
    { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'destructive' as const }
];

export function StatusControls({ gameInstanceId, currentStatus }: StatusControlsProps) {
    const [newStatus, setNewStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleStatusChange = async () => {
        if (!newStatus || newStatus === currentStatus) {
            setDialogOpen(false);

            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/admin/game-instances/${gameInstanceId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            toast({
                title: 'Status Updated',
                description: `Game instance status changed to ${newStatus}`
            });

            router.refresh();
            setDialogOpen(false);
        } catch (error) {
            console.error('Status update error:', error);
            toast({
                title: 'Error',
                description: 'Failed to update status. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const currentStatusOption = statusOptions.find((option) => option.value === currentStatus);
    const newStatusOption = statusOptions.find((option) => option.value === newStatus);
    const CurrentIcon = currentStatusOption?.icon || Clock;

    return (
        <div className='flex items-center gap-2'>
            <Badge variant={currentStatusOption?.color} className='flex items-center gap-1'>
                <CurrentIcon className='h-3 w-3' />
                {currentStatus}
            </Badge>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-6 w-6 p-1'>
                        <Settings className='h-3 w-3' />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Game Instance Status</DialogTitle>
                        <DialogDescription>
                            Select a new status for this game instance. This action will update the instance
                            immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4'>
                        <div>
                            <label className='text-sm font-medium'>Current Status:</label>
                            <div className='mt-1 flex items-center gap-2'>
                                <Badge variant={currentStatusOption?.color} className='flex items-center gap-1'>
                                    <CurrentIcon className='h-3 w-3' />
                                    {currentStatus}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className='text-sm font-medium'>New Status:</label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger className='mt-1'>
                                    <SelectValue placeholder='Select new status' />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => {
                                        const Icon = option.icon;
                                        const isDisabled = option.value === currentStatus;

                                        return (
                                            <SelectItem key={option.value} value={option.value} disabled={isDisabled}>
                                                <div className='flex items-center gap-2'>
                                                    <Icon className='h-4 w-4' />
                                                    {option.label}
                                                    {isDisabled && (
                                                        <span className='text-muted-foreground'>(current)</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {newStatus && newStatus !== currentStatus && (
                            <div className='bg-muted rounded-lg p-3'>
                                <div className='text-sm'>
                                    <strong>Preview:</strong>
                                    <div className='mt-1 flex items-center gap-2'>
                                        {currentStatusOption && (
                                            <Badge
                                                variant={currentStatusOption.color}
                                                className='flex items-center gap-1'>
                                                <CurrentIcon className='h-3 w-3' />
                                                {currentStatus}
                                            </Badge>
                                        )}
                                        <span>→</span>
                                        {newStatusOption && (
                                            <Badge variant={newStatusOption.color} className='flex items-center gap-1'>
                                                <newStatusOption.icon className='h-3 w-3' />
                                                {newStatus}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant='outline' onClick={() => setDialogOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStatusChange}
                            disabled={!newStatus || newStatus === currentStatus || isLoading}>
                            {isLoading ? <RefreshCw className='mr-2 h-4 w-4 animate-spin' /> : null}
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
