'use client';

import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Activity, Clock, DollarSign, GamepadIcon, Loader2, TrendingUp, Trophy, Users } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

interface DashboardStats {
    overview: {
        totalUsers: number;
        totalRevenue: number;
        activeGames: number;
        totalEntries: number;
        revenueGrowth: number;
        userGrowth: number;
    };
    revenueChart: Array<{
        date: string;
        revenue: number;
        entries: number;
    }>;
    gameStats: Array<{
        name: string;
        entries: number;
        revenue: number;
        color: string;
    }>;
    userActivity: Array<{
        hour: string;
        registrations: number;
        payments: number;
    }>;
    recentActivity: Array<{
        id: string;
        type: 'registration' | 'payment' | 'game_entry' | 'result';
        description: string;
        timestamp: string;
        amount?: number;
    }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function StatisticsDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        fetchDashboardStats();
    }, [timeRange]);
    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/dashboard-stats?range=${timeRange}`);

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard statistics');
            }

            const apiData = await response.json();

            // Transform API data to match our interface
            const transformedStats: DashboardStats = {
                overview: {
                    totalUsers: apiData.overview.totalUsers,
                    totalRevenue: apiData.overview.totalRevenue,
                    activeGames: apiData.overview.activeGames,
                    totalEntries: apiData.overview.totalEntries,
                    revenueGrowth: apiData.overview.revenueGrowth,
                    userGrowth: apiData.overview.entriesGrowth // Use entries growth as proxy for user growth
                },
                revenueChart: apiData.charts.revenueByDay.map((item: any) => ({
                    date: new Date(item.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
                    revenue: item.amount,
                    entries: 0 // We don't have entries per day data yet
                })),
                gameStats: apiData.gameStats.slice(0, 5).map((game: any, index: number) => ({
                    name: game.gameName,
                    entries: game.instanceCount,
                    revenue: 0, // We don't have revenue per game yet
                    color: COLORS[index % COLORS.length]
                })),
                userActivity: apiData.charts.userGrowth.map((item: any) => ({
                    hour: new Date(item.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
                    registrations: item.count,
                    payments: 0 // We don't have payments per day data yet
                })),
                recentActivity: apiData.recentActivity.map((activity: any) => ({
                    id: activity.id,
                    type: 'game_entry' as const,
                    description: `${activity.userName} joined ${activity.gameName}`,
                    timestamp: activity.createdAt,
                    amount: activity.entryFee
                }))
            };

            setStats(transformedStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `£${(amount / 100).toFixed(2)}`;
    };

    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';

        return `${sign}${value.toFixed(1)}%`;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'registration':
                return <Users className='h-4 w-4' />;
            case 'payment':
                return <DollarSign className='h-4 w-4' />;
            case 'game_entry':
                return <GamepadIcon className='h-4 w-4' />;
            case 'result':
                return <Trophy className='h-4 w-4' />;
            default:
                return <Activity className='h-4 w-4' />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'registration':
                return 'text-blue-600';
            case 'payment':
                return 'text-green-600';
            case 'game_entry':
                return 'text-purple-600';
            case 'result':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className='flex h-64 items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin' />
                <span className='ml-2'>Loading dashboard statistics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant='destructive'>
                <AlertDescription>Error loading dashboard statistics: {error}</AlertDescription>
            </Alert>
        );
    }

    if (!stats) {
        return (
            <Alert>
                <AlertDescription>No statistics data available.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Time Range Selector */}
            <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold'>Dashboard Overview</h2>
                <div className='flex space-x-2'>
                    {(['7d', '30d', '90d'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`rounded-md px-3 py-1 text-sm ${
                                timeRange === range
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                            }`}>
                            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Cards */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
                        <Users className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{stats.overview.totalUsers}</div>
                        <p className='text-muted-foreground text-xs'>
                            <span className={stats.overview.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatPercentage(stats.overview.userGrowth)}
                            </span>{' '}
                            from last period
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
                        <DollarSign className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-green-600'>
                            {formatCurrency(stats.overview.totalRevenue)}
                        </div>
                        <p className='text-muted-foreground text-xs'>
                            <span className={stats.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatPercentage(stats.overview.revenueGrowth)}
                            </span>{' '}
                            from last period
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Active Games</CardTitle>
                        <GamepadIcon className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-blue-600'>{stats.overview.activeGames}</div>
                        <p className='text-muted-foreground text-xs'>Currently running</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Total Entries</CardTitle>
                        <Trophy className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-purple-600'>{stats.overview.totalEntries}</div>
                        <p className='text-muted-foreground text-xs'>Across all games</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* Revenue Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Daily revenue and entry trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width='100%' height={300}>
                            <LineChart data={stats.revenueChart}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='date' />
                                <YAxis yAxisId='left' />
                                <YAxis yAxisId='right' orientation='right' />
                                <Tooltip
                                    formatter={(value: any, name: string) => [
                                        name === 'revenue' ? formatCurrency(value) : value,
                                        name === 'revenue' ? 'Revenue' : 'Entries'
                                    ]}
                                />
                                <Line
                                    yAxisId='left'
                                    type='monotone'
                                    dataKey='revenue'
                                    stroke='#8884d8'
                                    strokeWidth={2}
                                    name='revenue'
                                />
                                <Line
                                    yAxisId='right'
                                    type='monotone'
                                    dataKey='entries'
                                    stroke='#82ca9d'
                                    strokeWidth={2}
                                    name='entries'
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Game Performance Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Game Performance</CardTitle>
                        <CardDescription>Revenue distribution by game type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width='100%' height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.gameStats}
                                    cx='50%'
                                    cy='50%'
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill='#8884d8'
                                    dataKey='revenue'>
                                    {stats.gameStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* User Activity and Recent Activity */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* User Activity Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                        <CardDescription>Daily activity patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width='100%' height={300}>
                            <BarChart data={stats.userActivity}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='hour' />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey='registrations' fill='#8884d8' name='Registrations' />
                                <Bar dataKey='payments' fill='#82ca9d' name='Payments' />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest platform activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='max-h-80 space-y-4 overflow-y-auto'>
                            {stats.recentActivity.map((activity) => (
                                <div key={activity.id} className='flex items-start space-x-3 rounded-lg border p-3'>
                                    <div className={`${getActivityColor(activity.type)} mt-0.5`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className='flex-1 space-y-1'>
                                        <p className='text-sm font-medium'>{activity.description}</p>
                                        <div className='flex items-center justify-between'>
                                            <p className='text-muted-foreground text-xs'>
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                            {activity.amount && (
                                                <Badge variant='secondary'>{formatCurrency(activity.amount)}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
