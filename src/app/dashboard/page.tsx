import type { Metadata } from 'next';
// Import Metadata type
import { redirect } from 'next/navigation';

import { DashboardClientPage } from '@/components/dashboard-client-page';
import { authOptions } from '@/lib/auth-config';

import { getServerSession } from 'next-auth';

// Import the new client component

export const metadata: Metadata = {
    title: 'Dashboard',
    description:
        'Your personalized dashboard for FootyGames.co.uk. Manage your games, profile, and track your progress.'
};

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/api/auth/signin'); // Redirect to sign-in page if not authenticated
    }

    return <DashboardClientPage session={session} />;
}
