import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return { id: user.id, name: user.username, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        (token as Record<string, unknown>).username = user.name;
        (token as Record<string, unknown>).id = user.id;
      }
      if (trigger === "signIn" || trigger === "signUp" || trigger === "update") {
        const profile = await prisma.profile.findUnique({
          where: { userId: token.id as string },
          select: { avatarUrl: true },
        });
        (token as Record<string, unknown>).avatarUrl = profile?.avatarUrl ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.avatarUrl = (token as Record<string, unknown>).avatarUrl as string | null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      avatarUrl?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
