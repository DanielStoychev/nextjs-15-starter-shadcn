"use client";

import { Button } from "@/registry/new-york-v4/ui/button";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image"; // Import Image component
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/registry/new-york-v4/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/registry/new-york-v4/ui/accordion';

const competitions = [
  {
    title: 'Last Man Standing',
    description: 'Pick one winner each week. Survive the longest to claim the prize!',
  },
  {
    title: 'Table Predictor',
    description: 'Predict the final Premier League table. Accuracy is key!',
  },
  {
    title: 'Weekly Score Predictor',
    description: 'Guess the scores for weekly matches and earn points.',
  },
  {
    title: 'Race to 33',
    description: 'Be the first to accumulate 33 points from match predictions.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6 sm:p-12">
      {/* Hero Section */}
      <section className="relative text-center mb-20 w-full overflow-hidden">
        <Image
          src="/images/pikaso_texttoimage_3d-model-soccer-trophy-cabinet-filled-with-trophie.jpeg" // User provided image (corrected extension)
          alt="Football stadium background"
          fill
          className="absolute inset-0 z-0 opacity-30 object-cover" // Adjust opacity as needed
        />
        <div className="relative z-10 p-8">
          <h1 className="text-4xl sm:text-7xl font-extrabold mb-6 leading-tight animate-fade-in-up">
            Footy Games
          </h1>
          <p className="text-lg sm:text-2xl text-muted-foreground mb-10 animate-fade-in-up animation-delay-200">
            Your ultimate destination for Premier League mini-competitions.
            Pay a small entry fee, compete, and win big!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 animate-fade-in-up animation-delay-400">
            <Button
              onClick={() => signIn()}
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-6 py-3 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 w-full sm:px-8 sm:py-4 sm:text-lg sm:w-auto"
            >
              Join Now
            </Button>
            <Link href="#competitions">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-6 py-3 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 w-full sm:px-8 sm:py-4 sm:text-lg sm:w-auto"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full max-w-5xl text-center mb-16">
        <h2 className="text-4xl font-bold mb-10 text-foreground">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-card text-card-foreground border-border shadow-xl">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <CardTitle className="text-foreground">1. Join a Game</CardTitle>
              <CardDescription className="text-muted-foreground">
                Browse our selection of mini-competitions and join the one that suits you.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-card text-card-foreground border-border shadow-xl">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <CardTitle className="text-foreground">2. Compete</CardTitle>
              <CardDescription className="text-muted-foreground">
                Make your predictions, track your progress, and compete against other football fans.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-card text-card-foreground border-border shadow-xl">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-foreground">3. Win Big</CardTitle>
              <CardDescription className="text-muted-foreground">
                Outsmart your rivals and climb the leaderboard to win exciting cash prizes!
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Section: Strategy & Gameplay */}
      <section className="w-full max-w-5xl mb-16">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-4xl font-bold mb-6 text-foreground">Master Your Strategy</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Dive deep into the game with advanced prediction tools and strategic insights.
              Outwit your opponents and dominate the leaderboard with smart plays.
            </p>
            <Button
              onClick={() => signIn()}
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Explore Game Modes
            </Button>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/images/Close up of a s f436c24a-9be5-4bf3-a418-d114bf159c0a.png"
              alt="Futuristic strategy board"
              width={600}
              height={400}
              className="rounded-lg shadow-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Section: Prizes & Victory */}
      <section className="w-full max-w-5xl mb-16">
        <div className="flex flex-col md:flex-row-reverse items-center gap-8"> {/* Use flex-row-reverse for image on left */}
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-4xl font-bold mb-6 text-foreground">Claim Your Glory</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Compete for impressive cash prizes and earn your place among the champions.
              Every win brings you closer to ultimate football glory!
            </p>
            <Button
              onClick={() => signIn()}
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              See Prizes
            </Button>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/images/football trophy 5a34dd34-2e57-41b4-bd09-dbca352d8163.png"
              alt="Golden football trophy"
              width={600}
              height={400}
              className="rounded-lg shadow-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Section: Community & Engagement */}
      <section className="w-full max-w-5xl mb-16">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-4xl font-bold mb-6 text-foreground">Join Our Community</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Connect with thousands of passionate football fans. Share strategies, discuss matches, and celebrate victories together!
            </p>
            <Button
              onClick={() => signIn()}
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Connect with Fellow Fans
            </Button>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/images/fans-inside-huge-stadium-81774c08.png"
              alt="Packed football stadium"
              width={600}
              height={400}
              className="rounded-lg shadow-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Competitions Section */}
      <section id="competitions" className="w-full max-w-5xl text-center mb-16">
        <h2 className="text-4xl font-bold mb-10 text-foreground">Our Mini-Competitions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {competitions.map((competition, index) => (
            <Card key={index} className="bg-card text-card-foreground border-border shadow-xl h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-foreground">{competition.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {competition.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Additional content for the card can go here */}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="w-full max-w-3xl text-center mb-16">
        <h2 className="text-4xl font-bold mb-10 text-foreground">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full text-left">
          <AccordionItem value="item-1" className="border-border">
            <AccordionTrigger className="text-foreground hover:text-accent-orange">What is FootyGames.co.uk?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              FootyGames.co.uk is your ultimate destination for Premier League mini-competitions.
              You can join various games, compete against other football fans, and win cash prizes.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-border">
            <AccordionTrigger className="text-foreground hover:text-accent-orange">How do I join a competition?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Simply sign up, browse our available mini-competitions, pay a small entry fee, and you're in!
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="border-border">
            <AccordionTrigger className="text-foreground hover:text-accent-orange">Are the prizes real money?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes, all prizes are real cash prizes that are paid out to the winners.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4" className="border-border">
            <AccordionTrigger className="text-foreground hover:text-accent-orange">Is my data secure?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              We prioritize your data security. We use industry-standard encryption and security protocols to protect your information.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Call to Action / Footer */}
      <section className="text-center max-w-3xl">
        <h2 className="text-3xl font-bold mb-6 text-foreground">Ready to Play?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Sign up now and join the excitement of Premier League mini-competitions.
          Compete against friends and football fans worldwide!
        </p>
        <Button
          onClick={() => signIn()}
          variant="outline"
          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Sign Up Today
        </Button>
      </section>
    </div>
  );
}
