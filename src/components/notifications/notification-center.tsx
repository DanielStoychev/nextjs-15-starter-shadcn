'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent } from '@/registry/new-york-v4/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/new-york-v4/ui/popover';
import { ScrollArea } from '@/registry/new-york-v4/ui/scroll-area';

import { AlertCircle, Bell, Calendar, Check, Info, Trophy, X } from 'lucide-react';

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'game' | 'payment';
    title: string;
    message: string;
    createdAt: Date;
    read: boolean;
    actionUrl?: string;
    actionText?: string;
}

interface NotificationsProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClearAll: () => void;
}

function getNotificationIcon(type: string) {
    switch (type) {
        case 'success':
            return <Check className='h-4 w-4 text-green-500' />;
        case 'warning':
            return <AlertCircle className='h-4 w-4 text-yellow-500' />;
        case 'error':
            return <AlertCircle className='h-4 w-4 text-red-500' />;
        case 'game':
            return <Trophy className='h-4 w-4 text-blue-500' />;
        case 'payment':
            return <Calendar className='h-4 w-4 text-purple-500' />;
        default:
            return <Info className='h-4 w-4 text-gray-500' />;
    }
}

function getNotificationColor(type: string) {
    switch (type) {
        case 'success':
            return 'border-l-green-500';
        case 'warning':
            return 'border-l-yellow-500';
        case 'error':
            return 'border-l-red-500';
        case 'game':
            return 'border-l-blue-500';
        case 'payment':
            return 'border-l-purple-500';
        default:
            return 'border-l-gray-500';
    }
}

export default function NotificationCenter({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClearAll
}: NotificationsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const sortedNotifications = [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }

        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant='ghost'
                    size='sm'
                    className='relative p-2'
                    aria-label={`Notifications (${unreadCount} unread)`}>
                    <Bell className='h-5 w-5' />
                    {unreadCount > 0 && (
                        <Badge
                            className='absolute -top-1 -right-1 flex h-5 w-5 min-w-[20px] items-center justify-center p-0 text-xs'
                            variant='destructive'>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className='w-80 p-0' align='end'>
                <div className='border-b p-4'>
                    <div className='flex items-center justify-between'>
                        <h3 className='font-semibold'>Notifications</h3>
                        <div className='flex gap-2'>
                            {unreadCount > 0 && (
                                <Button variant='ghost' size='sm' onClick={onMarkAllAsRead} className='text-xs'>
                                    Mark all read
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button variant='ghost' size='sm' onClick={onClearAll} className='text-xs'>
                                    Clear all
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <ScrollArea className='h-[400px] max-h-[400px]'>
                    {sortedNotifications.length === 0 ? (
                        <div className='text-muted-foreground p-8 text-center'>
                            <Bell className='mx-auto mb-4 h-12 w-12 opacity-50' />
                            <p>No notifications yet</p>
                            <p className='text-sm'>We'll notify you about game updates and results</p>
                        </div>
                    ) : (
                        <div className='space-y-1 p-2'>
                            {sortedNotifications.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={`hover:bg-muted/50 cursor-pointer border-l-4 transition-colors ${getNotificationColor(notification.type)} ${
                                        !notification.read ? 'bg-muted/30' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}>
                                    <CardContent className='p-3'>
                                        <div className='flex items-start gap-3'>
                                            <div className='mt-0.5 flex-shrink-0'>
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div className='min-w-0 flex-1'>
                                                <div className='flex items-center justify-between'>
                                                    <p
                                                        className={`truncate text-sm font-medium ${
                                                            !notification.read ? 'font-semibold' : ''
                                                        }`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <div className='ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500' />
                                                    )}
                                                </div>

                                                <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                                                    {notification.message}
                                                </p>

                                                <div className='mt-2 flex items-center justify-between'>
                                                    <p className='text-muted-foreground text-xs'>
                                                        {new Date(notification.createdAt).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>

                                                    {notification.actionText && (
                                                        <span className='text-primary text-xs font-medium'>
                                                            {notification.actionText}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='h-6 w-6 p-1 opacity-0 transition-opacity group-hover:opacity-100'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMarkAsRead(notification.id);
                                                }}>
                                                <X className='h-3 w-3' />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
