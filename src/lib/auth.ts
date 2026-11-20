import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { findMockUserByEmail } from "@/lib/mockData";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Cafe Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@terracottacafe.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const email = credentials.email.toLowerCase().trim();
        const db = await connectDB();
        let user: any = null;

        if (db) {
          try {
            user = await User.findOne({ email });
          } catch (e: any) {
            console.warn("DB user lookup error, falling back to mock auth store:", e?.message);
          }
        }

        // 1. If found in MongoDB
        if (user) {
          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) {
            throw new Error("Incorrect password");
          }

          if (user.active === false) {
            throw new Error("Account is deactivated. Please contact your manager.");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role, // "ADMIN" | "EMPLOYEE"
          };
        }

        // 2. Check Mock / In-Memory User Directory
        const mockUser = findMockUserByEmail(email);
        if (mockUser) {
          const isMatch = await bcrypt.compare(credentials.password, mockUser.password);
          if (!isMatch) {
            throw new Error("Incorrect password");
          }

          if (mockUser.active === false) {
            throw new Error("Account is deactivated. Please contact your manager.");
          }

          return {
            id: mockUser._id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
          };
        }

        throw new Error("No user registered with this email");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "terracotta-default-secret-key-352b28",
};
