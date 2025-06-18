// Import authOptions from the API route file.
// It's generally better to have authOptions in a separate config file,
// but we'll work with the current structure.
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { type NextAuthOptions, getServerSession } from 'next-auth';
import NextAuth from 'next-auth';

// Keep NextAuth for signIn, signOut

// Export a function to get the session, similar to what `auth` from NextAuth() provides
export async function getSession() {
    return getServerSession(authOptions as NextAuthOptions);
}

// Keep signIn and signOut as they were, assuming they work correctly
// or are used in contexts where this specific Turbopack issue doesn't arise.
const { signIn, signOut } = NextAuth(authOptions);
export { signIn, signOut };

// Re-export auth as getSession for compatibility if other parts of the code expect `auth()`
export { getSession as auth };
