import NextAuth, { Session, User } from "next-auth" // Import Session and User types
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google" // Import GoogleProvider
import CredentialsProvider from "next-auth/providers/credentials" // Import CredentialsProvider
import { PrismaAdapter } from "@auth/prisma-adapter"; // New import
import prisma from "@/lib/prisma"; // New import for our prisma client
import bcrypt from "bcryptjs"; // Import bcryptjs


export const authOptions = {
  adapter: PrismaAdapter(prisma), // Add adapter
  // Configure one or more authentication providers
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Authorize: Received credentials:", credentials);

        if (!credentials?.email || !credentials?.password) {
          console.log("Authorize: Missing email or password.");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: { // Explicitly select fields, including role
            id: true,
            name: true,
            email: true,
            hashedPassword: true,
            role: true, // Include the role field
            stripeCustomerId: true,
            username: true,
            bio: true,
            location: true,
            favouriteTeam: true,
          },
        });

        console.log("Authorize: User found in DB:", user);

        if (!user || !user.hashedPassword) {
          console.log("Authorize: User not found or no hashed password in DB.");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        console.log("Authorize: Password comparison result:", isPasswordValid);

        if (!isPasswordValid) {
          console.log("Authorize: Invalid password.");
          return null;
        }

        console.log("Authorize: Login successful, returning user:", user.email);
        // Return the user object with the role already attached, explicitly cast to User
        return user as User;
      },
    }),
  ],
  callbacks: { // Add callbacks
    async jwt({ token, user, account, profile, isNewUser }: { token: any; user: any; account: any; profile?: any; isNewUser?: boolean }) { // Explicitly type parameters
      if (user) {
        // User object is available on first sign in or when session is updated
        // Fetch the user from the database to ensure we get the role
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true, // Ensure role is selected
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: any }) { // Explicitly type parameters
      // Session is created from the token
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
    redirect: async ({ url, baseUrl }: { url: string; baseUrl: string }) => { // Explicitly type parameters
      // Always redirect to the dashboard after successful login
      return baseUrl + '/dashboard';
    },
  },
  // Add secret for production
  secret: process.env.NEXTAUTH_SECRET,
  url: process.env.NEXTAUTH_URL, // Explicitly set URL
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
