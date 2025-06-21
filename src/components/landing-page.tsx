'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/registry/new-york-v4/ui/accordion';
import { Button } from '@/registry/new-york-v4/ui/button';
// Import Image component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { signIn } from 'next-auth/react';

const competitions = [
    {
        title: 'Last Man Standing',
        description: 'Pick one winner each week. Survive the longest to claim the prize!'
    },
    {
        title: 'Table Predictor',
        description: 'Predict the final Premier League table. Accuracy is key!'
    },
    {
        title: 'Weekly Score Predictor',
        description: 'Guess the scores for weekly matches and earn points.'
    },
    {
        title: 'Race to 33',
        description: 'Be the first to accumulate 33 points from match predictions.'
    }
];

export default function LandingPage() {
    return (
        <div className='bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-6 sm:p-12'>
            {/* Hero Section */}
            <section className='relative mb-20 w-full overflow-hidden text-center'>
                <Image
                    src='/images/pikaso_texttoimage_3d-model-soccer-trophy-cabinet-filled-with-trophie.jpeg' // User provided image (corrected extension)
                    alt='Football stadium background'
                    fill
                    className='absolute inset-0 z-0 object-cover opacity-30' // Adjust opacity as needed
                />
                <div className='relative z-10 p-8'>
                    <h1 className='animate-fade-in-up mb-6 text-4xl leading-tight font-extrabold sm:text-7xl'>
                        Footy Games
                    </h1>
                    <p className='text-muted-foreground animate-fade-in-up animation-delay-200 mb-10 text-lg sm:text-2xl'>
                        Your ultimate destination for Premier League mini-competitions. Pay a small entry fee, compete,
                        and win big!
                    </p>
                    <div className='animate-fade-in-up animation-delay-400 flex flex-col justify-center gap-4 sm:flex-row sm:gap-6'>
                        <Button
                            onClick={() => signIn()}
                            variant='outline'
                            className='border-border text-foreground hover:bg-accent hover:text-accent-foreground w-full transform rounded-xl px-6 py-3 text-base font-semibold shadow-lg transition-all duration-300 hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-lg'>
                            Join Now
                        </Button>
                        <Link href='#competitions'>
                            <Button
                                variant='outline'
                                className='border-border text-foreground hover:bg-accent hover:text-accent-foreground w-full transform rounded-xl px-6 py-3 text-base font-semibold shadow-lg transition-all duration-300 hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-lg'>
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>{' '}
            {/* How It Works Section */}
            <section id='how-it-works' className='mb-16 w-full max-w-5xl text-center'>
                <h2 className='text-foreground mb-4 text-4xl font-bold'>How It Works</h2>
                <p className='text-muted-foreground mx-auto mb-10 max-w-3xl text-lg'>
                    FootyGames makes it simple to join exciting football competitions and win real money prizes
                </p>

                <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardHeader>
                            <div className='mb-4 flex justify-center'>
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    className='text-accent-orange h-12 w-12'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth={2}>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                                    />
                                </svg>
                            </div>
                            <CardTitle className='text-foreground'>1. Join a Game</CardTitle>
                            <CardDescription className='text-muted-foreground mb-4'>
                                Browse our selection of mini-competitions and join the one that suits you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className='text-muted-foreground space-y-2 text-left text-sm'>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>Choose from 4 unique game types</span>
                                </li>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>Entry fees from just £1</span>
                                </li>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>Secure payment via Stripe</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardHeader>
                            <div className='mb-4 flex justify-center'>
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    className='text-accent-orange h-12 w-12'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth={2}>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                                    />
                                </svg>
                            </div>
                            <CardTitle className='text-foreground'>2. Compete</CardTitle>
                            <CardDescription className='text-muted-foreground mb-4'>
                                Make your predictions, track your progress, and compete against other football fans.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className='text-muted-foreground space-y-2 text-left text-sm'>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>Real-time leaderboards</span>
                                </li>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>Track your progress live</span>
                                </li>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>Compete against friends</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardHeader>
                            <div className='mb-4 flex justify-center'>
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    className='text-accent-orange h-12 w-12'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth={2}>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </div>
                            <CardTitle className='text-foreground'>3. Win Big</CardTitle>
                            <CardDescription className='text-muted-foreground mb-4'>
                                Outsmart your rivals and climb the leaderboard to win exciting cash prizes!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className='text-muted-foreground space-y-2 text-left text-sm'>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>Win real cash prizes</span>
                                </li>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>80% of entry fees go to prize pool</span>
                                </li>
                                <li className='flex items-start'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span>Fast, secure payouts</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className='mt-8'>
                    <Button
                        onClick={() => signIn()}
                        className='transform rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:opacity-90 hover:shadow-xl'>
                        Get Started Now
                    </Button>
                </div>
            </section>
            {/* Section: Strategy & Gameplay */}
            <section className='mb-16 w-full max-w-5xl'>
                <div className='flex flex-col items-center gap-8 md:flex-row'>
                    <div className='text-center md:w-1/2 md:text-left'>
                        <h2 className='text-foreground mb-6 text-4xl font-bold'>Master Your Strategy</h2>
                        <p className='text-muted-foreground mb-8 text-lg'>
                            Dive deep into the game with advanced prediction tools and strategic insights. Outwit your
                            opponents and dominate the leaderboard with smart plays.
                        </p>
                        <Button
                            onClick={() => signIn()}
                            variant='outline'
                            className='border-border text-foreground hover:bg-accent hover:text-accent-foreground transform rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105'>
                            Explore Game Modes
                        </Button>
                    </div>
                    <div className='md:w-1/2'>
                        <Image
                            src='/images/Close up of a s f436c24a-9be5-4bf3-a418-d114bf159c0a.png'
                            alt='Futuristic strategy board'
                            width={600}
                            height={400}
                            className='rounded-lg object-cover shadow-lg'
                        />
                    </div>
                </div>
            </section>
            {/* Section: Prizes & Victory */}
            <section className='mb-16 w-full max-w-5xl'>
                <div className='flex flex-col items-center gap-8 md:flex-row-reverse'>
                    {' '}
                    {/* Use flex-row-reverse for image on left */}
                    <div className='text-center md:w-1/2 md:text-left'>
                        <h2 className='text-foreground mb-6 text-4xl font-bold'>Claim Your Glory</h2>
                        <p className='text-muted-foreground mb-8 text-lg'>
                            Compete for impressive cash prizes and earn your place among the champions. Every win brings
                            you closer to ultimate football glory!
                        </p>
                        <Button
                            onClick={() => signIn()}
                            variant='outline'
                            className='border-border text-foreground hover:bg-accent hover:text-accent-foreground transform rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105'>
                            See Prizes
                        </Button>
                    </div>
                    <div className='md:w-1/2'>
                        <Image
                            src='/images/football trophy 5a34dd34-2e57-41b4-bd09-dbca352d8163.png'
                            alt='Golden football trophy'
                            width={600}
                            height={400}
                            className='rounded-lg object-cover shadow-lg'
                        />
                    </div>
                </div>
            </section>
            {/* Section: Community & Engagement */}
            <section className='mb-16 w-full max-w-5xl'>
                <div className='flex flex-col items-center gap-8 md:flex-row'>
                    <div className='text-center md:w-1/2 md:text-left'>
                        <h2 className='text-foreground mb-6 text-4xl font-bold'>Join Our Community</h2>
                        <p className='text-muted-foreground mb-8 text-lg'>
                            Connect with thousands of passionate football fans. Share strategies, discuss matches, and
                            celebrate victories together!
                        </p>
                        <Button
                            onClick={() => signIn()}
                            variant='outline'
                            className='border-border text-foreground hover:bg-accent hover:text-accent-foreground transform rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105'>
                            Connect with Fellow Fans
                        </Button>
                    </div>
                    <div className='md:w-1/2'>
                        <Image
                            src='/images/fans-inside-huge-stadium-81774c08.png'
                            alt='Packed football stadium'
                            width={600}
                            height={400}
                            className='rounded-lg object-cover shadow-lg'
                        />
                    </div>
                </div>
            </section>{' '}
            {/* Competitions Section */}
            <section id='competitions' className='mb-16 w-full max-w-5xl text-center'>
                <h2 className='text-foreground mb-4 text-4xl font-bold'>Our Mini-Competitions</h2>
                <p className='text-muted-foreground mx-auto mb-10 max-w-3xl text-lg'>
                    Discover our exciting range of football mini-competitions with various formats and prizes
                </p>

                <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
                    <Card className='bg-card text-card-foreground border-border flex h-full flex-col shadow-xl'>
                        <div className='relative h-48 overflow-hidden rounded-t-lg'>
                            <Image
                                src='/images/crystal ball wi 01fcb3e8-10ca-46ee-80c8-cbd6ba8a9287.png'
                                alt='Last Man Standing'
                                fill
                                className='object-cover'
                            />
                            <div className='absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent'>
                                <h3 className='p-4 text-2xl font-bold text-white'>Last Man Standing</h3>
                            </div>
                        </div>
                        <CardContent className='flex-grow p-6'>
                            <div className='mb-4 text-left'>
                                <p className='text-muted-foreground mb-4'>
                                    Pick one team to win each week. If your team wins, you move to the next round. Last
                                    player remaining wins the prize pool!
                                </p>
                                <div className='space-y-2'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Entry Fee:</span>
                                        <span className='font-medium'>£5</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Average Prize:</span>
                                        <span className='font-medium text-green-600'>£500+</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Difficulty:</span>
                                        <div className='flex'>
                                            {[...Array(3)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    className='h-5 w-5 text-yellow-500'
                                                    viewBox='0 0 20 20'
                                                    fill='currentColor'>
                                                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                                </svg>
                                            ))}
                                            {[...Array(2)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    className='h-5 w-5 text-gray-300'
                                                    viewBox='0 0 20 20'
                                                    fill='currentColor'>
                                                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => signIn()} className='w-full'>
                                Join Now
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className='bg-card text-card-foreground border-border flex h-full flex-col shadow-xl'>
                        <div className='relative h-48 overflow-hidden rounded-t-lg'>
                            <Image
                                src='/images/close up of bla 7c4d1884-d5b9-4fb5-83c1-d071dd991023.png'
                                alt='Race to 33'
                                fill
                                className='object-cover'
                            />
                            <div className='absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent'>
                                <h3 className='p-4 text-2xl font-bold text-white'>Race to 33</h3>
                            </div>
                        </div>
                        <CardContent className='flex-grow p-6'>
                            <div className='mb-4 text-left'>
                                <p className='text-muted-foreground mb-4'>
                                    Be the first player to accumulate 33 points from correct match predictions. First to
                                    reach the target wins the prize!
                                </p>
                                <div className='space-y-2'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Entry Fee:</span>
                                        <span className='font-medium'>£10</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Average Prize:</span>
                                        <span className='font-medium text-green-600'>£800+</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Difficulty:</span>
                                        <div className='flex'>
                                            {[...Array(4)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    className='h-5 w-5 text-yellow-500'
                                                    viewBox='0 0 20 20'
                                                    fill='currentColor'>
                                                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                                </svg>
                                            ))}
                                            <svg
                                                xmlns='http://www.w3.org/2000/svg'
                                                className='h-5 w-5 text-gray-300'
                                                viewBox='0 0 20 20'
                                                fill='currentColor'>
                                                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => signIn()} className='w-full'>
                                Join Now
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className='bg-card text-card-foreground border-border flex h-full flex-col shadow-xl'>
                        <div className='relative h-48 overflow-hidden rounded-t-lg'>
                            <Image
                                src='/images/A (((room))) de 4ce87d69-1710-498b-9cc6-4f8c2cbec395.png'
                                alt='Table Predictor'
                                fill
                                className='object-cover'
                            />
                            <div className='absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent'>
                                <h3 className='p-4 text-2xl font-bold text-white'>Table Predictor</h3>
                            </div>
                        </div>
                        <CardContent className='flex-grow p-6'>
                            <div className='mb-4 text-left'>
                                <p className='text-muted-foreground mb-4'>
                                    Predict the final Premier League table positions. The most accurate prediction wins
                                    the grand prize!
                                </p>
                                <div className='space-y-2'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Entry Fee:</span>
                                        <span className='font-medium'>£15</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Average Prize:</span>
                                        <span className='font-medium text-green-600'>£1200+</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Difficulty:</span>
                                        <div className='flex'>
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    className='h-5 w-5 text-yellow-500'
                                                    viewBox='0 0 20 20'
                                                    fill='currentColor'>
                                                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => signIn()} className='w-full'>
                                Join Now
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className='bg-card text-card-foreground border-border flex h-full flex-col shadow-xl'>
                        <div className='relative h-48 overflow-hidden rounded-t-lg'>
                            <Image
                                src='/images/A (((football b bc0fd89c-c9b9-41ab-84cd-5664ec5d7213.png'
                                alt='Weekly Score Predictor'
                                fill
                                className='object-cover'
                            />
                            <div className='absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent'>
                                <h3 className='p-4 text-2xl font-bold text-white'>Weekly Score Predictor</h3>
                            </div>
                        </div>
                        <CardContent className='flex-grow p-6'>
                            <div className='mb-4 text-left'>
                                <p className='text-muted-foreground mb-4'>
                                    Predict the exact scores for weekly Premier League matches. Points awarded for
                                    correct predictions with weekly prizes!
                                </p>
                                <div className='space-y-2'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Entry Fee:</span>
                                        <span className='font-medium'>£5</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Average Prize:</span>
                                        <span className='font-medium text-green-600'>£200+ per week</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Difficulty:</span>
                                        <div className='flex'>
                                            {[...Array(3)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    className='h-5 w-5 text-yellow-500'
                                                    viewBox='0 0 20 20'
                                                    fill='currentColor'>
                                                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                                </svg>
                                            ))}
                                            {[...Array(2)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    className='h-5 w-5 text-gray-300'
                                                    viewBox='0 0 20 20'
                                                    fill='currentColor'>
                                                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => signIn()} className='w-full'>
                                Join Now
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>
            {/* FAQ Section */}
            <section id='faq' className='mb-16 w-full max-w-3xl text-center'>
                <h2 className='text-foreground mb-10 text-4xl font-bold'>Frequently Asked Questions</h2>
                <Accordion type='single' collapsible className='w-full text-left'>
                    <AccordionItem value='item-1' className='border-border'>
                        <AccordionTrigger className='text-foreground hover:text-accent-orange'>
                            What is FootyGames.co.uk?
                        </AccordionTrigger>
                        <AccordionContent className='text-muted-foreground'>
                            FootyGames.co.uk is your ultimate destination for Premier League mini-competitions. You can
                            join various games, compete against other football fans, and win cash prizes.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='item-2' className='border-border'>
                        <AccordionTrigger className='text-foreground hover:text-accent-orange'>
                            How do I join a competition?
                        </AccordionTrigger>
                        <AccordionContent className='text-muted-foreground'>
                            Simply sign up, browse our available mini-competitions, pay a small entry fee, and you're
                            in!
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='item-3' className='border-border'>
                        <AccordionTrigger className='text-foreground hover:text-accent-orange'>
                            Are the prizes real money?
                        </AccordionTrigger>
                        <AccordionContent className='text-muted-foreground'>
                            Yes, all prizes are real cash prizes that are paid out to the winners.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='item-4' className='border-border'>
                        <AccordionTrigger className='text-foreground hover:text-accent-orange'>
                            Is my data secure?
                        </AccordionTrigger>
                        <AccordionContent className='text-muted-foreground'>
                            We prioritize your data security. We use industry-standard encryption and security protocols
                            to protect your information.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </section>
            {/* Testimonials Section */}
            <section id='testimonials' className='mb-16 w-full max-w-5xl text-center'>
                <h2 className='text-foreground mb-10 text-4xl font-bold'>What Our Players Say</h2>
                <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardContent className='pt-6'>
                            <div className='mb-4'>
                                <div className='mb-3 flex justify-center'>
                                    <Image
                                        src='/images/fans-inside-huge-stadium-81774c08.png'
                                        alt='User avatar'
                                        width={64}
                                        height={64}
                                        className='rounded-full object-cover'
                                    />
                                </div>
                                <h4 className='text-lg font-semibold'>Mike T.</h4>
                                <div className='my-2 flex justify-center'>
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='h-5 w-5 text-yellow-500'
                                            viewBox='0 0 20 20'
                                            fill='currentColor'>
                                            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                        </svg>
                                    ))}
                                </div>
                                <p className='text-muted-foreground italic'>
                                    "I've won twice in Last Man Standing! The rush of checking results each weekend is
                                    amazing. Best football game I've ever played."
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardContent className='pt-6'>
                            <div className='mb-4'>
                                <div className='mb-3 flex justify-center'>
                                    <Image
                                        src='/images/football trophy 5a34dd34-2e57-41b4-bd09-dbca352d8163.png'
                                        alt='User avatar'
                                        width={64}
                                        height={64}
                                        className='rounded-full object-cover'
                                    />
                                </div>
                                <h4 className='text-lg font-semibold'>Sarah K.</h4>
                                <div className='my-2 flex justify-center'>
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='h-5 w-5 text-yellow-500'
                                            viewBox='0 0 20 20'
                                            fill='currentColor'>
                                            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                        </svg>
                                    ))}
                                </div>
                                <p className='text-muted-foreground italic'>
                                    "Race to 33 is incredibly addictive! I love the weekly predictions and competing
                                    against my friends. The prize money was a nice bonus too!"
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardContent className='pt-6'>
                            <div className='mb-4'>
                                <div className='mb-3 flex justify-center'>
                                    <Image
                                        src='/images/Close up of a s f436c24a-9be5-4bf3-a418-d114bf159c0a.png'
                                        alt='User avatar'
                                        width={64}
                                        height={64}
                                        className='rounded-full object-cover'
                                    />
                                </div>
                                <h4 className='text-lg font-semibold'>James R.</h4>
                                <div className='my-2 flex justify-center'>
                                    {[...Array(4)].map((_, i) => (
                                        <svg
                                            key={i}
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='h-5 w-5 text-yellow-500'
                                            viewBox='0 0 20 20'
                                            fill='currentColor'>
                                            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                        </svg>
                                    ))}
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='h-5 w-5 text-gray-300'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'>
                                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                    </svg>
                                </div>
                                <p className='text-muted-foreground italic'>
                                    "Table Predictor really tests your Premier League knowledge! The interface is clean
                                    and the competition is fierce. Great fun!"
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
            {/* Stats Section */}
            <section className='mb-16 w-full max-w-5xl text-center'>
                <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4'>
                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardContent className='p-6'>
                            <div className='mb-2 text-4xl font-bold'>£10,000+</div>
                            <p className='text-muted-foreground'>Prize Money Paid</p>
                        </CardContent>
                    </Card>
                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardContent className='p-6'>
                            <div className='mb-2 text-4xl font-bold'>5,000+</div>
                            <p className='text-muted-foreground'>Active Players</p>
                        </CardContent>
                    </Card>
                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardContent className='p-6'>
                            <div className='mb-2 text-4xl font-bold'>95%</div>
                            <p className='text-muted-foreground'>Player Satisfaction</p>
                        </CardContent>
                    </Card>
                    <Card className='bg-card text-card-foreground border-border shadow-xl'>
                        <CardContent className='p-6'>
                            <div className='mb-2 text-4xl font-bold'>4</div>
                            <p className='text-muted-foreground'>Unique Game Types</p>
                        </CardContent>
                    </Card>
                </div>
            </section>
            {/* Call to Action / Footer */}
            <section className='mb-16 w-full max-w-5xl text-center'>
                <div className='bg-muted/30 rounded-xl p-8 shadow-lg'>
                    <h2 className='text-foreground mb-6 text-4xl font-bold'>Ready to Join the Action?</h2>
                    <p className='text-muted-foreground mx-auto mb-8 max-w-2xl text-lg'>
                        Sign up now and get a <span className='font-semibold'>FREE entry</span> to your first game! Join
                        thousands of football fans competing for glory and cash prizes.
                    </p>
                    <div className='flex flex-col justify-center gap-4 sm:flex-row'>
                        <Button
                            onClick={() => signIn()}
                            className='transform rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:opacity-90 hover:shadow-xl'>
                            Create Account Now
                        </Button>
                        <Button
                            asChild
                            variant='outline'
                            className='border-border text-foreground hover:bg-accent hover:text-accent-foreground transform rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105'>
                            <Link href='#how-it-works'>Learn More</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
