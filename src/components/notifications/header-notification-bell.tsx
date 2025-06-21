'use client';

import React, { useEffect, useState } from 'react';

import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/new-york-v4/ui/popover';
import { ScrollArea } from '@/registry/new-york-v4/ui/scroll-area';

import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Bell, Calendar, Check, Info, Trophy, X } from 'lucide-react';

interface Notification {
    id: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'GAME' | 'PAYMENT';
    title: string;
    message: string;
    createdAt: Date;
    read: boolean;
    actionUrl?: string;
    actionText?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

function getNotificationIcon(type: string) {
    switch (type) {
        case 'SUCCESS':
            return <Check className='h-4 w-4 text-green-500' />;
        case 'WARNING':
            return <AlertCircle className='h-4 w-4 text-yellow-500' />;
        case 'ERROR':
            return <AlertCircle className='h-4 w-4 text-red-500' />;
        case 'GAME':
            return <Trophy className='h-4 w-4 text-blue-500' />;
        case 'PAYMENT':
            return <Calendar className='h-4 w-4 text-purple-500' />;
        default:
            return <Info className='h-4 w-4 text-gray-500' />;
    }
}

function getNotificationBorderColor(type: string) {
    switch (type) {
        case 'SUCCESS':
            return 'border-l-green-500';
        case 'WARNING':
            return 'border-l-yellow-500';
        case 'ERROR':
            return 'border-l-red-500';
        case 'GAME':
            return 'border-l-blue-500';
        case 'PAYMENT':
            return 'border-l-purple-500';
        default:
            return 'border-l-gray-500';
    }
}

function getPriorityColor(priority: string) {
    // Simplified - just return empty string to avoid conflicts
    return '';
}

// Simple notification bell for header with real data
export function HeaderNotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                const parsedNotifications = data.notifications.map((n: any) => ({
                    ...n,
                    createdAt: new Date(n.createdAt)
                }));
                setNotifications(parsedNotifications);
                setUnreadCount(data.unreadCount || 0);
            } else {
                console.error('Failed to fetch notifications');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }

    async function markAsRead(notificationId: string) {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId, action: 'markAsRead' })
            });

            if (response.ok) {
                // Update local state
                setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAllAsRead' })
            });

            if (response.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    function handleNotificationClick(notification: Notification) {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant='ghost'
                    size='sm'
                    className='hover:bg-accent focus-visible:ring-ring relative h-9 w-9 rounded-full focus-visible:ring-2 focus-visible:outline-none'>
                    <Bell className='h-5 w-5' />
                    {unreadCount > 0 && (
                        <Badge
                            variant='destructive'
                            className='border-background absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 p-0 text-xs font-bold'>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                    <span className='sr-only'>
                        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className='bg-background/95 w-96 border p-0 shadow-lg backdrop-blur-sm'
                align='end'
                sideOffset={8}>
                <div className='space-y-0'>
                    {/* Header */}
                    <div className='border-border bg-background/90 flex items-center justify-between border-b p-4'>
                        <h4 className='text-foreground font-semibold'>Notifications</h4>
                        <div className='flex items-center gap-2'>
                            {unreadCount > 0 && (
                                <Badge variant='secondary' className='text-xs'>
                                    {unreadCount} new
                                </Badge>
                            )}
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => fetchNotifications()}
                                disabled={loading}
                                className='h-8 text-xs'>
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <ScrollArea className='bg-background/90 h-80'>
                        {loading ? (
                            <div className='bg-background flex items-center justify-center py-8'>
                                <div className='text-foreground text-sm'>Loading notifications...</div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className='bg-background flex flex-col items-center justify-center px-4 py-8'>
                                <Bell className='text-muted-foreground mb-2 h-8 w-8' />
                                <div className='text-foreground text-center text-sm font-medium'>
                                    No notifications yet
                                </div>
                                <div className='text-muted-foreground mt-1 text-center text-xs'>
                                    You'll see game updates and announcements here
                                </div>
                            </div>
                        ) : (
                            <div className='bg-background/90 space-y-1 p-2'>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`hover:bg-accent/80 cursor-pointer rounded-lg border-l-4 p-3 transition-all duration-200 ${getNotificationBorderColor(notification.type)} ${!notification.read ? 'bg-background border shadow-sm' : 'bg-background/70 opacity-90'} `}
                                        onClick={() => handleNotificationClick(notification)}>
                                        <div className='flex items-start gap-3'>
                                            <div className='mt-0.5 flex-shrink-0'>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className='min-w-0 flex-1'>
                                                <div className='flex items-center justify-between gap-2'>
                                                    <p
                                                        className={`truncate text-sm ${!notification.read ? 'text-foreground font-semibold' : 'text-foreground/80 font-medium'}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <div className='bg-primary h-2 w-2 flex-shrink-0 rounded-full' />
                                                    )}
                                                </div>
                                                <p
                                                    className={`mt-1 text-xs leading-relaxed ${!notification.read ? 'text-foreground/90' : 'text-foreground/70'}`}>
                                                    {notification.message}
                                                </p>
                                                <div className='mt-2 flex items-center justify-between'>
                                                    <span className='text-foreground/60 text-xs'>
                                                        {formatDistanceToNow(notification.createdAt, {
                                                            addSuffix: true
                                                        })}
                                                    </span>
                                                    {notification.actionText && (
                                                        <span className='text-primary text-xs font-medium hover:underline'>
                                                            {notification.actionText} →
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className='border-border bg-background/90 flex items-center justify-between border-t p-3'>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                                className='text-foreground hover:bg-accent h-8 text-xs'>
                                Mark all read
                            </Button>
                            <Button
                                variant='ghost'
                                size='sm'
                                className='text-primary hover:text-primary hover:bg-accent h-8 text-xs'>
                                View all
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
