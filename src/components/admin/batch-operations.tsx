'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/formatting';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Checkbox } from '@/registry/new-york-v4/ui/checkbox';
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
import { Separator } from '@/registry/new-york-v4/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

import {
    AlertTriangle,
    Archive,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    MoreHorizontal,
    Play,
    RefreshCw,
    Settings,
    Square,
    Trash2,
    Users,
    XCircle
} from 'lucide-react';

interface GameInstance {
    id: string;
    name: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    startDate: string;
    endDate: string;
    entryFee: number;
    prizePool: number;
    game: {
        id: string;
        name: string;
        slug: string;
    };
    userEntries?: Array<{
        id: string;
        status: string;
        user: {
            name: string;
            email: string;
        };
    }>;
    totalEntries?: number;
    totalRevenue?: number;
    completedEntries?: number;
    pendingEntries?: number;
}

interface BatchOperationsProps {
    gameInstances: GameInstance[];
}

const statusColors = {
    PENDING: 'default',
    ACTIVE: 'default',
    COMPLETED: 'secondary',
    CANCELLED: 'destructive'
} as const;

const statusIcons = {
    PENDING: Clock,
    ACTIVE: Play,
    COMPLETED: CheckCircle,
    CANCELLED: XCircle
};

export function BatchOperations({ gameInstances }: BatchOperationsProps) {
    const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
    const [batchAction, setBatchAction] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; count: number }>({
        open: false,
        action: '',
        count: 0
    });
    const { toast } = useToast();
    const router = useRouter();

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedInstances(gameInstances.map((instance) => instance.id));
        } else {
            setSelectedInstances([]);
        }
    };

    const handleSelectInstance = (instanceId: string, checked: boolean) => {
        if (checked) {
            setSelectedInstances((prev) => [...prev, instanceId]);
        } else {
            setSelectedInstances((prev) => prev.filter((id) => id !== instanceId));
        }
    };

    const handleBatchAction = async (action: string) => {
        if (selectedInstances.length === 0) {
            toast({
                title: 'No Selection',
                description: 'Please select at least one game instance.',
                variant: 'destructive'
            });

            return;
        }

        setConfirmDialog({
            open: true,
            action,
            count: selectedInstances.length
        });
    };

    const executeBatchAction = async () => {
        setIsLoading(true);
        setConfirmDialog({ open: false, action: '', count: 0 });

        try {
            const response = await fetch('/api/admin/game-instances/batch', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: confirmDialog.action,
                    instanceIds: selectedInstances
                })
            });

            if (!response.ok) {
                throw new Error('Failed to execute batch operation');
            }

            const result = await response.json();

            toast({
                title: 'Batch Operation Successful',
                description: `Successfully ${confirmDialog.action.toLowerCase()}ed ${selectedInstances.length} game instance(s).`
            });
            setSelectedInstances([]);
            setBatchAction('');
            router.refresh();
        } catch (error) {
            console.error('Batch operation error:', error);
            toast({
                title: 'Error',
                description: 'Failed to execute batch operation. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getActionDescription = (action: string) => {
        switch (action) {
            case 'activate':
                return 'This will start the selected game instances and make them available for entries.';
            case 'complete':
                return 'This will mark the selected game instances as completed and stop accepting new entries.';
            case 'cancel':
                return 'This will cancel the selected game instances. This action cannot be undone.';
            case 'archive':
                return 'This will archive the selected game instances, moving them out of the active list.';
            case 'delete':
                return 'This will permanently delete the selected game instances. This action cannot be undone.';
            default:
                return '';
        }
    };

    const selectedCount = selectedInstances.length;
    const allSelected = selectedCount === gameInstances.length && gameInstances.length > 0;
    const someSelected = selectedCount > 0 && selectedCount < gameInstances.length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <Settings className='h-5 w-5' />
                    Batch Operations
                </CardTitle>
                <CardDescription>
                    Select multiple game instances to perform bulk actions such as status changes, archiving, or
                    deletion.
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                {/* Batch Action Controls */}
                <div className='bg-muted/50 flex flex-wrap items-center gap-4 rounded-lg p-4'>
                    <div className='flex items-center gap-2'>
                        <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                        <span className='text-sm font-medium'>
                            Select All ({selectedCount} of {gameInstances.length} selected)
                        </span>
                    </div>

                    <Separator orientation='vertical' className='h-6' />

                    <div className='flex items-center gap-2'>
                        <Select value={batchAction} onValueChange={setBatchAction}>
                            <SelectTrigger className='w-40'>
                                <SelectValue placeholder='Choose action' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='activate'>
                                    <div className='flex items-center gap-2'>
                                        <Play className='h-4 w-4' />
                                        Activate
                                    </div>
                                </SelectItem>
                                <SelectItem value='complete'>
                                    <div className='flex items-center gap-2'>
                                        <CheckCircle className='h-4 w-4' />
                                        Complete
                                    </div>
                                </SelectItem>
                                <SelectItem value='cancel'>
                                    <div className='flex items-center gap-2'>
                                        <XCircle className='h-4 w-4' />
                                        Cancel
                                    </div>
                                </SelectItem>
                                <SelectItem value='archive'>
                                    <div className='flex items-center gap-2'>
                                        <Archive className='h-4 w-4' />
                                        Archive
                                    </div>
                                </SelectItem>
                                <SelectItem value='delete'>
                                    <div className='flex items-center gap-2'>
                                        <Trash2 className='h-4 w-4' />
                                        Delete
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => handleBatchAction(batchAction)}
                            disabled={!batchAction || selectedCount === 0 || isLoading}
                            variant={batchAction === 'delete' || batchAction === 'cancel' ? 'destructive' : 'default'}>
                            {isLoading ? <RefreshCw className='mr-2 h-4 w-4 animate-spin' /> : null}
                            Apply to {selectedCount} item{selectedCount !== 1 ? 's' : ''}{' '}
                        </Button>
                    </div>
                </div>
                {/* Game Instances Table */}
                <div className='rounded-lg border'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className='w-12'>
                                    <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                                </TableHead>
                                <TableHead>Game Instance</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Entries</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gameInstances.map((instance) => {
                                const StatusIcon = statusIcons[instance.status];
                                const isSelected = selectedInstances.includes(instance.id);

                                return (
                                    <TableRow key={instance.id} className={isSelected ? 'bg-muted/50' : ''}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) =>
                                                    handleSelectInstance(instance.id, checked as boolean)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className='space-y-1'>
                                                <div className='font-medium'>{instance.name}</div>
                                                <div className='text-muted-foreground text-sm'>
                                                    {instance.game.name}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={statusColors[instance.status]}
                                                className='flex w-fit items-center gap-1'>
                                                <StatusIcon className='h-3 w-3' />
                                                {instance.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className='space-y-1 text-sm'>
                                                <div className='flex items-center gap-1'>
                                                    <Calendar className='h-3 w-3' />
                                                    {formatDate(instance.startDate)}
                                                </div>
                                                <div className='text-muted-foreground'>
                                                    to {formatDate(instance.endDate)}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-1'>
                                                <Users className='h-3 w-3' />
                                                <span>{instance.totalEntries || 0}</span>
                                                {instance.pendingEntries ? (
                                                    <span className='text-muted-foreground'>
                                                        ({instance.pendingEntries} pending)
                                                    </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-1'>
                                                <DollarSign className='h-3 w-3' />
                                                <span>{formatCurrency(instance.totalRevenue || 0)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant='ghost' size='sm'>
                                                <MoreHorizontal className='h-4 w-4' />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Confirmation Dialog */}
                <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className='flex items-center gap-2'>
                                <AlertTriangle className='h-5 w-5 text-amber-500' />
                                Confirm Batch Operation
                            </DialogTitle>
                            <DialogDescription>
                                You are about to <strong>{confirmDialog.action}</strong> {confirmDialog.count} game
                                instance(s).
                            </DialogDescription>
                        </DialogHeader>
                        <Alert>
                            <AlertDescription>{getActionDescription(confirmDialog.action)}</AlertDescription>
                        </Alert>
                        <DialogFooter>
                            <Button
                                variant='outline'
                                onClick={() => setConfirmDialog({ open: false, action: '', count: 0 })}>
                                Cancel
                            </Button>
                            <Button
                                onClick={executeBatchAction}
                                disabled={isLoading}
                                variant={
                                    confirmDialog.action === 'delete' || confirmDialog.action === 'cancel'
                                        ? 'destructive'
                                        : 'default'
                                }>
                                {isLoading ? <RefreshCw className='mr-2 h-4 w-4 animate-spin' /> : null}
                                Confirm {confirmDialog.action}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
