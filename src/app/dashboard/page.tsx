import { getServerSession } from "next-auth";
import type { Metadata } from 'next'; // Import Metadata type
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DashboardClientPage } from "@/components/dashboard-client-page"; // Import the new client component

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your personalized dashboard for FootyGames.co.uk. Manage your games, profile, and track your progress.',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin"); // Redirect to sign-in page if not authenticated
  }

  return <DashboardClientPage session={session} />;
}
