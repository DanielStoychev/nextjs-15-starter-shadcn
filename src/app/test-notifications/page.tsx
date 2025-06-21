import { AdminNotificationPanel } from '@/components/admin/admin-notification-panel';

export default function TestNotificationsPage() {
    return (
        <div className='container mx-auto py-8'>
            <div className='mb-8 text-center'>
                <h1 className='mb-2 text-3xl font-bold'>Test Notifications System</h1>
                <p className='text-muted-foreground'>
                    Use this panel to test the notification system by sending custom notifications.
                </p>
            </div>

            <AdminNotificationPanel />
        </div>
    );
}
