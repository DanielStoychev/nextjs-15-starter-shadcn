'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/registry/new-york-v4/ui/dialog';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Label } from '@/registry/new-york-v4/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';
import { Separator } from '@/registry/new-york-v4/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';
import { Textarea } from '@/registry/new-york-v4/ui/textarea';

import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    Edit3,
    Eye,
    FileText,
    History,
    Play,
    RotateCcw,
    Settings,
    Square,
    Trophy,
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
        currentScore: number;
    }>;
    _count?: {
        userEntries: number;
    };
}

interface ResultsOverride {
    gameInstanceId: string;
    reason: string;
    changes: Array<{
        userId: string;
        userName: string;
        oldScore: number;
        newScore: number;
    }>;
    adminNotes?: string;
}

interface AuditLog {
    id: string;
    adminId: string;
    adminName: string;
    action: string;
    gameInstanceId: string;
    details: any;
    timestamp: string;
}

export function ResultsManagement() {
    const { toast } = useToast();
    const [gameInstances, setGameInstances] = useState<GameInstance[]>([]);
    const [selectedGame, setSelectedGame] = useState<GameInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [showOverrideDialog, setShowOverrideDialog] = useState(false);
    const [showAuditDialog, setShowAuditDialog] = useState(false);
    const [overrideForm, setOverrideForm] = useState<ResultsOverride>({
        gameInstanceId: '',
        reason: '',
        changes: [],
        adminNotes: ''
    });

    const statusColors = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        ACTIVE: 'bg-blue-100 text-blue-800',
        COMPLETED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-red-100 text-red-800'
    };

    const statusIcons = {
        PENDING: Clock,
        ACTIVE: Play,
        COMPLETED: CheckCircle,
        CANCELLED: XCircle
    };

    useEffect(() => {
        fetchGameInstances();
        fetchAuditLogs();
    }, []);

    const fetchGameInstances = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/game-instances?include=userEntries');

            if (!response.ok) {
                throw new Error('Failed to fetch game instances');
            }

            const data = await response.json();
            setGameInstances(data);
        } catch (error) {
            console.error('Error fetching game instances:', error);
            toast({
                title: 'Error',
                description: 'Failed to load game instances',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };
    const fetchAuditLogs = async () => {
        try {
            const response = await fetch('/api/admin/audit-logs?type=results');

            if (response.ok) {
                const data = await response.json();
                setAuditLogs(data.auditLogs || []);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setAuditLogs([]);
        }
    };

    const processResults = async (gameInstanceId: string, action: 'start' | 'complete' | 'cancel') => {
        try {
            setProcessing(true);

            const response = await fetch(`/api/admin/game-instances/${gameInstanceId}/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${action} game results`);
            }

            const result = await response.json();

            toast({
                title: 'Success',
                description: `Game results ${action}ed successfully`
            });

            // Refresh data
            await fetchGameInstances();
            await fetchAuditLogs();
        } catch (error) {
            console.error(`Error ${action}ing results:`, error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : `Failed to ${action} results`,
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleOverrideResults = async () => {
        try {
            setProcessing(true);

            const response = await fetch('/api/admin/results-override', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(overrideForm)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to override results');
            }

            toast({
                title: 'Success',
                description: 'Results override applied successfully'
            });

            setShowOverrideDialog(false);
            setOverrideForm({
                gameInstanceId: '',
                reason: '',
                changes: [],
                adminNotes: ''
            });

            // Refresh data
            await fetchGameInstances();
            await fetchAuditLogs();
        } catch (error) {
            console.error('Error overriding results:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to override results',
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
        }
    };

    const exportResults = async (gameInstanceId: string) => {
        try {
            const response = await fetch(`/api/admin/game-instances/${gameInstanceId}/export`);

            if (!response.ok) {
                throw new Error('Failed to export results');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `game-results-${gameInstanceId}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Success',
                description: 'Results exported successfully'
            });
        } catch (error) {
            console.error('Error exporting results:', error);
            toast({
                title: 'Error',
                description: 'Failed to export results',
                variant: 'destructive'
            });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center p-8'>
                <div className='text-center'>
                    <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
                    <p>Loading game instances...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>Results Management</h2>
                    <p className='text-muted-foreground'>Manage game results, process manually, and view audit logs</p>
                </div>
                <div className='flex items-center gap-2'>
                    <Button variant='outline' onClick={() => setShowAuditDialog(true)}>
                        <History className='mr-2 h-4 w-4' />
                        Audit Logs
                    </Button>
                    <Button onClick={fetchGameInstances}>
                        <RotateCcw className='mr-2 h-4 w-4' />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Game Instances Table */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Trophy className='h-5 w-5' />
                        Game Instances
                    </CardTitle>
                    <CardDescription>Manage and process results for all game instances</CardDescription>
                </CardHeader>
                <CardContent>
                    {gameInstances.length === 0 ? (
                        <Alert>
                            <AlertTriangle className='h-4 w-4' />
                            <AlertDescription>
                                No game instances found. Create some game instances to manage results.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Game</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead>Prize Pool</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gameInstances.map((instance) => {
                                    const StatusIcon = statusIcons[instance.status];
                                    const participantCount =
                                        instance._count?.userEntries || instance.userEntries?.length || 0;

                                    return (
                                        <TableRow key={instance.id}>
                                            <TableCell>
                                                <div>
                                                    <p className='font-medium'>{instance.name}</p>
                                                    <p className='text-muted-foreground text-sm'>
                                                        {instance.game.name}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[instance.status]}>
                                                    <StatusIcon className='mr-1 h-3 w-3' />
                                                    {instance.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className='flex items-center gap-1'>
                                                    <Users className='text-muted-foreground h-4 w-4' />
                                                    <span>{participantCount}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatCurrency(instance.prizePool)}</TableCell>
                                            <TableCell>{formatDate(instance.startDate)}</TableCell>
                                            <TableCell>{formatDate(instance.endDate)}</TableCell>
                                            <TableCell>
                                                <div className='flex items-center gap-2'>
                                                    <Button
                                                        variant='outline'
                                                        size='sm'
                                                        onClick={() => setSelectedGame(instance)}>
                                                        <Eye className='h-4 w-4' />
                                                    </Button>

                                                    {instance.status === 'PENDING' && (
                                                        <Button
                                                            size='sm'
                                                            onClick={() => processResults(instance.id, 'start')}
                                                            disabled={processing}>
                                                            <Play className='mr-1 h-4 w-4' />
                                                            Start
                                                        </Button>
                                                    )}

                                                    {instance.status === 'ACTIVE' && (
                                                        <>
                                                            <Button
                                                                size='sm'
                                                                onClick={() => processResults(instance.id, 'complete')}
                                                                disabled={processing}>
                                                                <CheckCircle className='mr-1 h-4 w-4' />
                                                                Complete
                                                            </Button>
                                                            <Button
                                                                size='sm'
                                                                variant='outline'
                                                                onClick={() => {
                                                                    setOverrideForm((prev) => ({
                                                                        ...prev,
                                                                        gameInstanceId: instance.id
                                                                    }));
                                                                    setShowOverrideDialog(true);
                                                                }}>
                                                                <Edit3 className='mr-1 h-4 w-4' />
                                                                Override
                                                            </Button>
                                                        </>
                                                    )}

                                                    {instance.status === 'COMPLETED' && (
                                                        <Button
                                                            size='sm'
                                                            variant='outline'
                                                            onClick={() => exportResults(instance.id)}>
                                                            <Download className='mr-1 h-4 w-4' />
                                                            Export
                                                        </Button>
                                                    )}

                                                    {(instance.status === 'PENDING' ||
                                                        instance.status === 'ACTIVE') && (
                                                        <Button
                                                            size='sm'
                                                            variant='destructive'
                                                            onClick={() => processResults(instance.id, 'cancel')}
                                                            disabled={processing}>
                                                            <XCircle className='mr-1 h-4 w-4' />
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Game Details Modal */}
            {selectedGame && (
                <Dialog open={!!selectedGame} onOpenChange={() => setSelectedGame(null)}>
                    <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
                        <DialogHeader>
                            <DialogTitle>{selectedGame.name} - Results Details</DialogTitle>
                            <DialogDescription>View detailed results and participant information</DialogDescription>
                        </DialogHeader>
                        <div className='space-y-4'>
                            {/* Game Info */}
                            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                                <Card className='p-4 text-center'>
                                    <div className='text-2xl font-bold'>{selectedGame.userEntries?.length || 0}</div>
                                    <div className='text-muted-foreground text-sm'>Participants</div>
                                </Card>
                                <Card className='p-4 text-center'>
                                    <div className='text-2xl font-bold'>{formatCurrency(selectedGame.prizePool)}</div>
                                    <div className='text-muted-foreground text-sm'>Prize Pool</div>
                                </Card>
                                <Card className='p-4 text-center'>
                                    <div className='text-2xl font-bold'>{formatCurrency(selectedGame.entryFee)}</div>
                                    <div className='text-muted-foreground text-sm'>Entry Fee</div>
                                </Card>
                                <Card className='p-4 text-center'>
                                    <Badge className={statusColors[selectedGame.status]}>{selectedGame.status}</Badge>
                                </Card>
                            </div>

                            {/* Participants */}
                            {selectedGame.userEntries && selectedGame.userEntries.length > 0 && (
                                <div>
                                    <h4 className='mb-2 text-lg font-semibold'>Participants</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Current Score</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedGame.userEntries.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className='font-medium'>
                                                                {entry.user.name || 'Anonymous'}
                                                            </p>
                                                            <p className='text-muted-foreground text-sm'>
                                                                {entry.user.email}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant='outline'>{entry.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>{entry.currentScore}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Results Override Dialog */}
            <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Override Results</DialogTitle>
                        <DialogDescription>
                            Make manual adjustments to game results. This action will be logged for audit purposes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div>
                            <Label htmlFor='reason'>Reason for Override</Label>
                            <Select
                                value={overrideForm.reason}
                                onValueChange={(value) => setOverrideForm((prev) => ({ ...prev, reason: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder='Select reason' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='technical_issue'>Technical Issue</SelectItem>
                                    <SelectItem value='incorrect_data'>Incorrect Data</SelectItem>
                                    <SelectItem value='dispute_resolution'>Dispute Resolution</SelectItem>
                                    <SelectItem value='admin_correction'>Admin Correction</SelectItem>
                                    <SelectItem value='other'>Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor='notes'>Admin Notes</Label>
                            <Textarea
                                id='notes'
                                value={overrideForm.adminNotes}
                                onChange={(e) => setOverrideForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
                                placeholder='Additional notes about this override...'
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setShowOverrideDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleOverrideResults} disabled={!overrideForm.reason || processing}>
                            {processing ? 'Processing...' : 'Apply Override'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Audit Logs Dialog */}
            <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
                <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>Audit Logs - Results Management</DialogTitle>
                        <DialogDescription>Track all admin actions related to results management</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        {auditLogs.length === 0 ? (
                            <Alert>
                                <AlertTriangle className='h-4 w-4' />
                                <AlertDescription>No audit logs found.</AlertDescription>
                            </Alert>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Game Instance</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {auditLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.adminName}</TableCell>
                                            <TableCell>
                                                <Badge variant='outline'>{log.action}</Badge>
                                            </TableCell>
                                            <TableCell>{log.gameInstanceId}</TableCell>
                                            <TableCell>{formatDate(log.timestamp)}</TableCell>
                                            <TableCell>
                                                <Button variant='ghost' size='sm'>
                                                    <FileText className='h-4 w-4' />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
