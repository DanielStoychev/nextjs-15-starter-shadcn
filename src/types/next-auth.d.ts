import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      stripeCustomerId?: string | null;
      username?: string | null;
      bio?: string | null;
      location?: string | null;
      favouriteTeam?: string | null;
      role?: "ADMIN" | "USER"; // Add role to session user
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    stripeCustomerId?: string | null;
    username?: string | null;
    bio?: string | null;
    location?: string | null;
    favouriteTeam?: string | null;
    role?: "ADMIN" | "USER"; // Ensure role is also on the User type
  }
}
