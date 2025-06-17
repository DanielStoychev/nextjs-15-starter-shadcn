// New import
import { Role } from '@/generated/prisma';
import prisma from '@/lib/prisma';
// Import CredentialsProvider
import { PrismaAdapter } from '@auth/prisma-adapter';

// New import for our prisma client
import bcrypt from 'bcryptjs';
import NextAuth, { Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
// Import Role enum
// Import GoogleProvider
import CredentialsProvider from 'next-auth/providers/credentials';
// Import Session and User types
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

// Import bcryptjs

export const authOptions = {
    // adapter: PrismaAdapter(prisma), // Temporarily commented out for JWT strategy testing
    // Configure one or more authentication providers
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID ?? '',
            clientSecret: process.env.GITHUB_SECRET ?? ''
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                // console.log('Authorize: Received credentials:', credentials); // Removed for production

                if (!credentials?.email || !credentials?.password) {
                    // console.log('Authorize: Missing email or password.'); // Removed for production
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    },
                    select: {
                        // Explicitly select fields, including role
                        id: true,
                        name: true,
                        email: true,
                        hashedPassword: true,
                        role: true, // Include the role field
                        stripeCustomerId: true,
                        username: true,
                        bio: true,
                        location: true,
                        favouriteTeam: true
                    }
                });

                console.log('Authorize: User found in DB:', user); // Re-enabled for debugging

                if (!user || !user.hashedPassword) {
                    // console.log('Authorize: User not found or no hashed password in DB.'); // Removed for production
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.hashedPassword);

                console.log('Authorize: Password comparison result:', isPasswordValid); // Re-enabled for debugging

                if (!isPasswordValid) {
                    // console.log('Authorize: Invalid password.'); // Removed for production
                    return null;
                }

                console.log('Authorize: Login successful, returning user:', user.email); // Re-enabled for debugging
                // Return the user object with the role already attached, explicitly cast to User

                return user as User;
            }
        })
    ],
    session: {
        strategy: 'jwt' as const // Changed to JWT strategy for testing
    },
    callbacks: {
        // Add callbacks
        async session({ session, token }: { session: Session; token: JWT }) {
            // Changed 'user' to 'token' for JWT strategy
            console.log('Session Callback: Initial session:', session);
            console.log('Session Callback: Token object from JWT:', token); // Changed log for JWT strategy

            if (session.user) {
                session.user.id = token.id as string; // Use token.id for JWT strategy
                session.user.role = token.role as Role; // Cast to Role enum type
            }

            console.log('Session Callback: Final session:', session);

            return session;
        },
        async jwt({ token, user }: { token: JWT; user: User }) {
            // The user object is only available on the first call (i.e., after authorize)
            console.log('JWT Callback: Initial token:', token);
            console.log('JWT Callback: User object:', user);

            if (user) {
                token.id = user.id;
                token.role = user.role;
            }

            console.log('JWT Callback: Final token:', token);

            return token;
        },
        redirect: async ({ url, baseUrl }: { url: string; baseUrl: string }) => {
            // Explicitly type parameters
            // Redirect to home page on sign out, otherwise to dashboard
            if (url.startsWith(`${baseUrl}/api/auth/signout`)) {
                return baseUrl + '/';
            }
            // Always redirect to the dashboard after successful login
            return baseUrl + '/dashboard';
        }
    },
    // Add secret for production
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL, // Explicitly set URL
    pages: {
        signIn: '/auth/login', // Specify our custom login page
        signOut: '/', // Redirect to home page on sign out
        error: '/auth/login' // Redirect to login page on error
        // You can also specify other pages like verifyRequest, newUser
    },
    debug: true // Enable debug mode for verbose logging
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
