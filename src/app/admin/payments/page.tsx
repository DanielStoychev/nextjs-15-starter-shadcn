import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

import PaymentDashboard from '../../../components/admin/payment-dashboard';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
    title: 'Payment Analytics - Admin Dashboard',
    description: 'Payment analytics and transaction management for FootyGames'
};

export default async function AdminPaymentPage() {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/auth/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user || user.role !== Role.ADMIN) {
        redirect('/');
    }

    return (
        <div className='container mx-auto py-8'>
            <div className='mb-8'>
                <h1 className='text-3xl font-bold'>Payment Analytics</h1>
                <p className='text-muted-foreground mt-2'>Monitor payments, revenue, and transaction history</p>
            </div>

            <PaymentDashboard />
        </div>
    );
}
