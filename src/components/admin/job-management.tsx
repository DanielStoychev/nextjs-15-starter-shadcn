'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Separator } from '@/registry/new-york-v4/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

import { AlertTriangle, CheckCircle, Clock, Play, RefreshCw, Square, Zap } from 'lucide-react';

interface Job {
    name: string;
    enabled: boolean;
    schedule: string;
    running: boolean;
}

interface JobStatusResponse {
    status: string;
    jobs: Job[];
}

export default function JobManagement() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { toast } = useToast();

    const fetchJobStatus = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);

        try {
            const response = await fetch('/api/admin/jobs');
            if (!response.ok) {
                throw new Error('Failed to fetch job status');
            }

            const data: JobStatusResponse = await response.json();
            setJobs(data.jobs);
        } catch (error) {
            console.error('Error fetching job status:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch job status',
                variant: 'destructive'
            });
        } finally {
            if (showRefresh) setIsRefreshing(false);
        }
    };

    const executeJobAction = async (action: string, jobName?: string) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action, jobName })
            });

            if (!response.ok) {
                throw new Error('Failed to execute job action');
            }

            const data = await response.json();

            toast({
                title: 'Success',
                description: data.message
            });

            // Refresh job status
            await fetchJobStatus();
        } catch (error) {
            console.error('Error executing job action:', error);
            toast({
                title: 'Error',
                description: 'Failed to execute job action',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobStatus();
    }, []);

    const getStatusBadge = (job: Job) => {
        if (!job.enabled) {
            return <Badge variant='secondary'>Disabled</Badge>;
        }
        if (job.running) {
            return (
                <Badge variant='default' className='bg-green-500'>
                    Running
                </Badge>
            );
        }

        return <Badge variant='outline'>Stopped</Badge>;
    };

    const getStatusIcon = (job: Job) => {
        if (!job.enabled) {
            return <Square className='h-4 w-4 text-gray-500' />;
        }
        if (job.running) {
            return <CheckCircle className='h-4 w-4 text-green-500' />;
        }

        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
    };

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle className='flex items-center gap-2'>
                            <Clock className='h-5 w-5' />
                            Job Management
                        </CardTitle>
                        <CardDescription>Monitor and control automated job processing</CardDescription>
                    </div>
                    <Button variant='outline' size='sm' onClick={() => fetchJobStatus(true)} disabled={isRefreshing}>
                        {isRefreshing ? (
                            <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                        ) : (
                            <RefreshCw className='mr-2 h-4 w-4' />
                        )}
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className='space-y-6'>
                {/* Scheduler Controls */}
                <div className='bg-muted/50 flex items-center gap-2 rounded-lg p-4'>
                    <div className='flex flex-1 items-center gap-2'>
                        <Clock className='h-4 w-4' />
                        <span className='font-medium'>Scheduler Control</span>
                    </div>
                    <div className='flex gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => executeJobAction('start')}
                            disabled={isLoading}>
                            <Play className='mr-2 h-4 w-4' />
                            Start All
                        </Button>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => executeJobAction('stop')}
                            disabled={isLoading}>
                            <Square className='mr-2 h-4 w-4' />
                            Stop All
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Job Status Table */}
                <div>
                    <h3 className='mb-4 text-lg font-semibold'>Job Status</h3>
                    {jobs.length === 0 ? (
                        <Alert>
                            <AlertTriangle className='h-4 w-4' />
                            <AlertDescription>
                                No job information available. Click refresh to load job status.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className='rounded-lg border'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Job Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Schedule</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs.map((job) => (
                                        <TableRow key={job.name}>
                                            <TableCell>
                                                <div className='flex items-center gap-2'>
                                                    {getStatusIcon(job)}
                                                    <span className='font-medium'>{job.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(job)}</TableCell>
                                            <TableCell>
                                                <code className='bg-muted rounded px-2 py-1 text-sm'>
                                                    {job.schedule}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() => executeJobAction('run', job.name)}
                                                    disabled={isLoading || !job.enabled}>
                                                    <Zap className='mr-2 h-4 w-4' />
                                                    Run Now
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* Job Descriptions */}
                <div>
                    <h3 className='mb-4 text-lg font-semibold'>Job Descriptions</h3>
                    <div className='grid gap-4'>
                        <div className='rounded-lg border p-4'>
                            <h4 className='mb-2 font-medium'>Fixture Update</h4>
                            <p className='text-muted-foreground text-sm'>
                                Fetches latest fixture data from SportMonks API and updates scores automatically. Runs
                                every 6 hours to keep game data current.
                            </p>
                        </div>
                        <div className='rounded-lg border p-4'>
                            <h4 className='mb-2 font-medium'>Result Processing</h4>
                            <p className='text-muted-foreground text-sm'>
                                Processes game results and updates user scores for Race to 33, Table Predictor, and
                                Weekly Score Predictor games. Runs every 2 hours to ensure timely score updates.
                            </p>
                        </div>
                        <div className='rounded-lg border p-4'>
                            <h4 className='mb-2 font-medium'>Game Instance Status Check</h4>
                            <p className='text-muted-foreground text-sm'>
                                Automatically transitions game instances between PENDING, ACTIVE, and COMPLETED states
                                based on dates. Runs hourly to ensure games are properly managed.
                            </p>
                        </div>
                        <div className='rounded-lg border p-4'>
                            <h4 className='mb-2 font-medium'>Cleanup Job</h4>
                            <p className='text-muted-foreground text-sm'>
                                Removes expired payment entries, old tokens, and performs database maintenance. Runs
                                daily at 2 AM to keep the database clean.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
