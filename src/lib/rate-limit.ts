// Rate limiting utility for authentication endpoints
import { NextResponse } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN
      })
    : null;

// Rate limiters for different endpoints
export const passwordResetLimiter = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(3, '15 m'), // 3 attempts per 15 minutes
          analytics: true
      })
    : null;

export const emailVerificationLimiter = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 attempts per hour
          analytics: true
      })
    : null;

export const loginLimiter = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 login attempts per 15 minutes
          analytics: true
      })
    : null;

export const registrationLimiter = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 registration attempts per hour
          analytics: true
      })
    : null;

// Helper function to get client IP
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIP) {
        return realIP;
    }

    // Fallback for development
    return '127.0.0.1';
}

// Rate limiting middleware
export async function checkRateLimit(
    request: Request,
    limiter: Ratelimit | null,
    identifier?: string
): Promise<NextResponse | null> {
    if (!limiter) {
        // If Redis is not configured, allow the request (for development)
        console.log('Rate limiting disabled (Redis not configured)');

        return null;
    }

    try {
        const ip = identifier || getClientIP(request);
        const { success, limit, reset, remaining } = await limiter.limit(ip);

        if (!success) {
            const resetTime = new Date(reset);
            const resetTimeString = resetTime.toLocaleTimeString();

            return NextResponse.json(
                {
                    message: 'Too many requests. Please try again later.',
                    details: `Rate limit exceeded. Try again after ${resetTimeString}`,
                    retryAfter: Math.round((reset - Date.now()) / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString(),
                        'Retry-After': Math.round((reset - Date.now()) / 1000).toString()
                    }
                }
            );
        }

        return null;
    } catch (error) {
        // If Redis connection fails, fall back to memory-based rate limiting
        console.warn('Redis rate limiting failed, falling back to memory-based limiting:', error);

        const ip = identifier || getClientIP(request);

        // Determine which memory limiter to use based on the Redis limiter
        let memoryLimiter: MemoryRateLimit;
        if (limiter === passwordResetLimiter) {
            memoryLimiter = memoryPasswordResetLimiter;
        } else if (limiter === emailVerificationLimiter) {
            memoryLimiter = memoryEmailVerificationLimiter;
        } else if (limiter === loginLimiter) {
            memoryLimiter = memoryLoginLimiter;
        } else if (limiter === registrationLimiter) {
            memoryLimiter = memoryRegistrationLimiter;
        } else {
            // Default fallback
            memoryLimiter = memoryRegistrationLimiter;
        }

        return checkMemoryRateLimit(request, memoryLimiter, identifier);
    }
}

// Simple in-memory rate limiting for when Redis is not available
class MemoryRateLimit {
    private requests: Map<string, number[]> = new Map();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number, windowMs: number) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    check(identifier: string): boolean {
        const now = Date.now();
        const userRequests = this.requests.get(identifier) || [];

        // Remove old requests outside the window
        const validRequests = userRequests.filter((time) => now - time < this.windowMs);

        if (validRequests.length >= this.maxRequests) {
            return false; // Rate limit exceeded
        }

        // Add current request
        validRequests.push(now);
        this.requests.set(identifier, validRequests);

        return true; // Request allowed
    }
}

// Fallback in-memory rate limiters
export const memoryPasswordResetLimiter = new MemoryRateLimit(3, 15 * 60 * 1000); // 3 per 15 minutes
export const memoryEmailVerificationLimiter = new MemoryRateLimit(5, 60 * 60 * 1000); // 5 per hour
export const memoryLoginLimiter = new MemoryRateLimit(5, 15 * 60 * 1000); // 5 per 15 minutes
export const memoryRegistrationLimiter = new MemoryRateLimit(3, 60 * 60 * 1000); // 3 per hour

// Simple rate limiting check for memory-based limiting
export function checkMemoryRateLimit(
    request: Request,
    limiter: MemoryRateLimit,
    identifier?: string
): NextResponse | null {
    const ip = identifier || getClientIP(request);

    if (!limiter.check(ip)) {
        return NextResponse.json(
            {
                message: 'Too many requests. Please try again later.',
                details: 'Rate limit exceeded. Please wait before trying again.'
            },
            { status: 429 }
        );
    }

    return null;
}
