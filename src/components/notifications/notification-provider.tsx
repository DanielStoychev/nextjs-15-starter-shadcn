'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { Notification } from './notification-center';

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
    userId?: string;
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Load notifications from localStorage on mount
    useEffect(() => {
        if (userId) {
            const stored = localStorage.getItem(`notifications_${userId}`);
            if (stored) {
                try {
                    const parsedNotifications = JSON.parse(stored).map((n: any) => ({
                        ...n,
                        createdAt: new Date(n.createdAt)
                    }));
                    setNotifications(parsedNotifications);
                } catch (error) {
                    console.error('Failed to parse stored notifications:', error);
                }
            }
        }
    }, [userId]);

    // Save notifications to localStorage whenever they change
    useEffect(() => {
        if (userId && notifications.length >= 0) {
            localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
        }
    }, [notifications, userId]);

    // Fetch notifications from API on mount and periodically
    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/notifications');
                if (response.ok) {
                    const serverNotifications = await response.json();
                    // Merge with local notifications, prioritizing server data
                    setNotifications((prev) => {
                        const serverIds = new Set(serverNotifications.map((n: Notification) => n.id));
                        const localOnly = prev.filter((n) => !serverIds.has(n.id));

                        return [
                            ...serverNotifications.map((n: any) => ({
                                ...n,
                                createdAt: new Date(n.createdAt)
                            })),
                            ...localOnly
                        ];
                    });
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchNotifications();

        // Fetch notifications every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [userId]);

    const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date()
        };

        setNotifications((prev) => [newNotification, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const clearNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
                clearNotification
            }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }

    return context;
}

// Helper hook for common notification types
export function useGameNotifications() {
    const { addNotification } = useNotifications();

    const notifyGameStart = (gameName: string, instanceName: string) => {
        addNotification({
            type: 'game',
            title: 'Game Started!',
            message: `${gameName} - ${instanceName} has begun. Good luck!`,
            read: false,
            actionUrl: '/dashboard',
            actionText: 'View Dashboard'
        });
    };

    const notifyGameEnd = (gameName: string, instanceName: string, position?: number) => {
        addNotification({
            type: position && position <= 3 ? 'success' : 'info',
            title: 'Game Completed!',
            message: position
                ? `${gameName} - ${instanceName} finished! You placed ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}.`
                : `${gameName} - ${instanceName} has ended. Check the results!`,
            read: false,
            actionUrl: '/leaderboards',
            actionText: 'View Results'
        });
    };

    const notifyPaymentSuccess = (gameName: string, instanceName: string, amount: number) => {
        addNotification({
            type: 'success',
            title: 'Payment Successful!',
            message: `You've successfully entered ${gameName} - ${instanceName} for £${(amount / 100).toFixed(2)}.`,
            read: false,
            actionUrl: '/dashboard',
            actionText: 'View Games'
        });
    };

    const notifyPaymentFailed = (gameName: string, instanceName: string) => {
        addNotification({
            type: 'error',
            title: 'Payment Failed',
            message: `Payment for ${gameName} - ${instanceName} could not be processed. Please try again.`,
            read: false,
            actionUrl: '/games',
            actionText: 'Try Again'
        });
    };

    const notifyWinnings = (gameName: string, amount: number) => {
        addNotification({
            type: 'success',
            title: '🎉 Congratulations!',
            message: `You won £${amount.toFixed(2)} in ${gameName}! Your winnings have been added to your account.`,
            read: false,
            actionUrl: '/dashboard',
            actionText: 'View Dashboard'
        });
    };

    return {
        notifyGameStart,
        notifyGameEnd,
        notifyPaymentSuccess,
        notifyPaymentFailed,
        notifyWinnings
    };
}
