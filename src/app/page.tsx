"use client";

import type { Metadata } from 'next'; // Import Metadata type
import { useSession } from "next-auth/react";
import LandingPage from "@/components/landing-page"; // Import the new LandingPage component
import HomeClientPage from "@/components/home-client-page"; // Import the new HomeClientPage component

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (session) {
    return <HomeClientPage />;
  }

  return <LandingPage />;
}
