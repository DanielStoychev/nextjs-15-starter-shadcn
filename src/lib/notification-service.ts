import prisma from '@/lib/prisma';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'GAME' | 'PAYMENT';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface NotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionText?: string;
}

export class NotificationService {
    // Create a single notification
    static async createNotification(data: NotificationData) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    priority: data.priority || 'MEDIUM',
                    actionUrl: data.actionUrl,
                    actionText: data.actionText,
                    read: false
                }
            });

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Create notifications for multiple users
    static async createBulkNotifications(data: Omit<NotificationData, 'userId'> & { userIds: string[] }) {
        try {
            const notifications = data.userIds.map((userId) => ({
                userId,
                type: data.type,
                title: data.title,
                message: data.message,
                priority: data.priority || 'MEDIUM',
                actionUrl: data.actionUrl,
                actionText: data.actionText,
                read: false
            }));

            const result = await prisma.notification.createMany({
                data: notifications
            });

            return result;
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            throw error;
        }
    }

    // Create notifications for all users
    static async createNotificationForAllUsers(data: Omit<NotificationData, 'userId'>) {
        try {
            const users = await prisma.user.findMany({
                select: { id: true }
            });

            const userIds = users.map((user) => user.id);

            return await this.createBulkNotifications({ ...data, userIds });
        } catch (error) {
            console.error('Error creating notifications for all users:', error);
            throw error;
        }
    }

    // Game-specific notification methods
    static async notifyGameStart(gameInstanceId: string) {
        try {
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameInstanceId },
                include: {
                    game: true,
                    userEntries: { select: { userId: true } }
                }
            });

            if (!gameInstance) return;

            // Get all users who haven't entered yet but might be interested
            const enteredUserIds = gameInstance.userEntries.map((entry) => entry.userId);
            const potentialUsers = await prisma.user.findMany({
                where: {
                    id: { notIn: enteredUserIds }
                    // Add any other criteria for eligible users
                },
                select: { id: true }
            });

            await this.createBulkNotifications({
                userIds: potentialUsers.map((user) => user.id),
                type: 'GAME',
                title: `${gameInstance.game.name} is now open`,
                message: `Predictions for ${gameInstance.name} are now open for entry`,
                priority: 'MEDIUM',
                actionUrl: `/games/${gameInstance.game.slug}/${gameInstance.id}`,
                actionText: 'Enter Now'
            });
        } catch (error) {
            console.error('Error sending game start notifications:', error);
        }
    }

    static async notifyDeadlineApproaching(gameInstanceId: string, hoursLeft: number) {
        try {
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameInstanceId },
                include: {
                    game: true,
                    userEntries: { select: { userId: true } }
                }
            });

            if (!gameInstance) return;

            // Notify users who haven't submitted yet
            const enteredUserIds = gameInstance.userEntries.map((entry) => entry.userId);
            const pendingUsers = await prisma.user.findMany({
                where: {
                    id: { notIn: enteredUserIds }
                },
                select: { id: true }
            });

            await this.createBulkNotifications({
                userIds: pendingUsers.map((user) => user.id),
                type: 'WARNING',
                title: 'Deadline Approaching',
                message: `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left to submit your predictions for ${gameInstance.name}`,
                priority: 'HIGH',
                actionUrl: `/games/${gameInstance.game.slug}/${gameInstance.id}`,
                actionText: 'Submit Now'
            });
        } catch (error) {
            console.error('Error sending deadline notifications:', error);
        }
    }

    static async notifyDeadlineMissed(gameInstanceId: string) {
        try {
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameInstanceId },
                include: {
                    game: true,
                    userEntries: { select: { userId: true } }
                }
            });

            if (!gameInstance) return;

            // Notify users who missed the deadline
            const enteredUserIds = gameInstance.userEntries.map((entry) => entry.userId);
            const missedUsers = await prisma.user.findMany({
                where: {
                    id: { notIn: enteredUserIds }
                },
                select: { id: true }
            });

            await this.createBulkNotifications({
                userIds: missedUsers.map((user) => user.id),
                type: 'ERROR',
                title: 'Entry Period Ended',
                message: `Entry period for ${gameInstance.name} predictions has ended`,
                priority: 'MEDIUM'
            });
        } catch (error) {
            console.error('Error sending deadline missed notifications:', error);
        }
    }

    static async notifyGameResult(userId: string, gameInstanceId: string, points: number, matchDescription: string) {
        try {
            await this.createNotification({
                userId,
                type: 'GAME',
                title: 'Prediction Result',
                message: `Your prediction for ${matchDescription} earned you ${points} points`,
                priority: 'MEDIUM',
                actionUrl: `/games/results/${gameInstanceId}`,
                actionText: 'View Results'
            });
        } catch (error) {
            console.error('Error sending game result notification:', error);
        }
    }

    static async notifyLeaderboardChange(
        userId: string,
        newPosition: number,
        gameInstanceId: string,
        gameName: string
    ) {
        try {
            await this.createNotification({
                userId,
                type: 'GAME',
                title: 'Leaderboard Update',
                message: `You've moved to ${newPosition}${this.getOrdinalSuffix(newPosition)} place in ${gameName}`,
                priority: 'MEDIUM',
                actionUrl: `/games/leaderboard/${gameInstanceId}`,
                actionText: 'View Leaderboard'
            });
        } catch (error) {
            console.error('Error sending leaderboard notification:', error);
        }
    }

    static async notifyGameCompleted(gameInstanceId: string) {
        try {
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: gameInstanceId },
                include: {
                    game: true,
                    userEntries: { select: { userId: true } }
                }
            });

            if (!gameInstance) return;

            await this.createBulkNotifications({
                userIds: gameInstance.userEntries.map((entry) => entry.userId),
                type: 'INFO',
                title: 'Game Completed',
                message: `${gameInstance.name} has concluded. Check your final results!`,
                priority: 'MEDIUM',
                actionUrl: `/games/results/${gameInstance.id}`,
                actionText: 'View Results'
            });
        } catch (error) {
            console.error('Error sending game completed notifications:', error);
        }
    }

    // Payment notification methods
    static async notifyPaymentSuccess(userId: string, amount: number, description: string) {
        try {
            await this.createNotification({
                userId,
                type: 'PAYMENT',
                title: 'Payment Successful',
                message: `Your payment of £${(amount / 100).toFixed(2)} for ${description} was successful`,
                priority: 'MEDIUM'
            });
        } catch (error) {
            console.error('Error sending payment success notification:', error);
        }
    }

    static async notifyPaymentFailed(userId: string, amount: number, description: string) {
        try {
            await this.createNotification({
                userId,
                type: 'ERROR',
                title: 'Payment Failed',
                message: `Your payment attempt of £${(amount / 100).toFixed(2)} for ${description} was declined`,
                priority: 'HIGH',
                actionUrl: '/profile/payment-methods',
                actionText: 'Update Payment'
            });
        } catch (error) {
            console.error('Error sending payment failed notification:', error);
        }
    }

    static async notifyWinningsAvailable(userId: string, amount: number, gameName: string) {
        try {
            await this.createNotification({
                userId,
                type: 'SUCCESS',
                title: 'Congratulations!',
                message: `You've won £${(amount / 100).toFixed(2)} in ${gameName}`,
                priority: 'HIGH',
                actionUrl: '/profile/winnings',
                actionText: 'Claim Prize'
            });
        } catch (error) {
            console.error('Error sending winnings notification:', error);
        }
    }

    // Success notification methods
    static async notifyAccountCreated(userId: string) {
        try {
            await this.createNotification({
                userId,
                type: 'SUCCESS',
                title: 'Welcome to FootyGames!',
                message: 'Your account has been created successfully. Ready to test your football knowledge?',
                priority: 'MEDIUM',
                actionUrl: '/games',
                actionText: 'Explore Games'
            });
        } catch (error) {
            console.error('Error sending account created notification:', error);
        }
    }

    static async notifyProfileUpdated(userId: string) {
        try {
            await this.createNotification({
                userId,
                type: 'SUCCESS',
                title: 'Profile Updated',
                message: 'Your profile has been successfully updated',
                priority: 'LOW'
            });
        } catch (error) {
            console.error('Error sending profile updated notification:', error);
        }
    }

    static async notifyEntrySubmitted(userId: string, gameName: string, gameInstanceId: string) {
        try {
            await this.createNotification({
                userId,
                type: 'SUCCESS',
                title: 'Entry Submitted',
                message: `Your predictions for ${gameName} have been submitted`,
                priority: 'MEDIUM',
                actionUrl: `/games/entry/${gameInstanceId}`,
                actionText: 'View Entry'
            });
        } catch (error) {
            console.error('Error sending entry submitted notification:', error);
        }
    }

    static async notifyPrizeClaimed(userId: string, amount: number) {
        try {
            await this.createNotification({
                userId,
                type: 'SUCCESS',
                title: 'Prize Claimed',
                message: `You've successfully claimed your £${(amount / 100).toFixed(2)} prize`,
                priority: 'MEDIUM'
            });
        } catch (error) {
            console.error('Error sending prize claimed notification:', error);
        }
    }

    // Warning notification methods
    static async notifyMissingInformation(userId: string) {
        try {
            await this.createNotification({
                userId,
                type: 'WARNING',
                title: 'Complete Your Profile',
                message: 'Please complete your profile to enter premium games',
                priority: 'MEDIUM',
                actionUrl: '/profile',
                actionText: 'Complete Profile'
            });
        } catch (error) {
            console.error('Error sending missing information notification:', error);
        }
    }

    static async notifyVerificationNeeded(userId: string) {
        try {
            await this.createNotification({
                userId,
                type: 'WARNING',
                title: 'Verification Required',
                message: 'Account verification required for payouts over £100',
                priority: 'HIGH',
                actionUrl: '/profile/verification',
                actionText: 'Verify Account'
            });
        } catch (error) {
            console.error('Error sending verification notification:', error);
        }
    }

    static async notifySubscriptionEnding(userId: string, daysLeft: number) {
        try {
            await this.createNotification({
                userId,
                type: 'WARNING',
                title: 'Subscription Ending',
                message: `Your premium subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
                priority: 'MEDIUM',
                actionUrl: '/profile/subscription',
                actionText: 'Renew Now'
            });
        } catch (error) {
            console.error('Error sending subscription ending notification:', error);
        }
    }

    static async notifyLowBalance(userId: string, balance: number) {
        try {
            await this.createNotification({
                userId,
                type: 'WARNING',
                title: 'Low Balance',
                message: `Your account balance is below £${(balance / 100).toFixed(2)}`,
                priority: 'MEDIUM',
                actionUrl: '/profile/wallet',
                actionText: 'Add Funds'
            });
        } catch (error) {
            console.error('Error sending low balance notification:', error);
        }
    }

    // Error notification methods
    static async notifyLoginFailed(userId: string) {
        try {
            await this.createNotification({
                userId,
                type: 'ERROR',
                title: 'Unusual Login Attempt',
                message: 'Unusual login attempt detected from new device',
                priority: 'HIGH',
                actionUrl: '/profile/security',
                actionText: 'Review Security'
            });
        } catch (error) {
            console.error('Error sending login failed notification:', error);
        }
    }

    static async notifyServerIssue() {
        try {
            await this.createNotificationForAllUsers({
                type: 'ERROR',
                title: 'Service Update',
                message: "We're experiencing issues with game data updates. Our team is working on a fix.",
                priority: 'MEDIUM'
            });
        } catch (error) {
            console.error('Error sending server issue notification:', error);
        }
    }

    static async notifyEntryFailed(userId: string, gameName: string) {
        try {
            await this.createNotification({
                userId,
                type: 'ERROR',
                title: 'Entry Failed',
                message: `Your entry for ${gameName} predictions couldn't be processed`,
                priority: 'HIGH',
                actionUrl: '/support',
                actionText: 'Contact Support'
            });
        } catch (error) {
            console.error('Error sending entry failed notification:', error);
        }
    }

    static async notifyPaymentProcessingError(userId: string) {
        try {
            await this.createNotification({
                userId,
                type: 'ERROR',
                title: 'Payment Processing Error',
                message: 'Error processing your recent payment. Please try again.',
                priority: 'HIGH',
                actionUrl: '/profile/payment-methods',
                actionText: 'Retry Payment'
            });
        } catch (error) {
            console.error('Error sending payment processing error notification:', error);
        }
    }

    // Info notification methods
    static async notifyNewFeature(title: string, message: string, actionUrl?: string) {
        try {
            await this.createNotificationForAllUsers({
                type: 'INFO',
                title,
                message,
                priority: 'LOW',
                actionUrl,
                actionText: actionUrl ? 'Learn More' : undefined
            });
        } catch (error) {
            console.error('Error sending new feature notification:', error);
        }
    }

    static async notifyMaintenance(startTime: string, endTime: string) {
        try {
            await this.createNotificationForAllUsers({
                type: 'INFO',
                title: 'Scheduled Maintenance',
                message: `Scheduled maintenance from ${startTime} to ${endTime}`,
                priority: 'MEDIUM'
            });
        } catch (error) {
            console.error('Error sending maintenance notification:', error);
        }
    }

    static async notifyRulesUpdate(gameName: string) {
        try {
            await this.createNotificationForAllUsers({
                type: 'INFO',
                title: 'Rules Updated',
                message: `We've updated the scoring rules for ${gameName}`,
                priority: 'MEDIUM',
                actionUrl: '/rules',
                actionText: 'View Rules'
            });
        } catch (error) {
            console.error('Error sending rules update notification:', error);
        }
    }

    // Utility methods
    private static getOrdinalSuffix(num: number): string {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';

        return 'th';
    }
}
