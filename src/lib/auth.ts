import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { findDbUserByEmail } from "@/lib/persistentDb";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
        const password = credentials.password;

        // 1. If an external backend is configured, delegate auth to it
        if (process.env.BACKEND_URL) {
          try {
            const res = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
              const data = await res.json();
              return data.user;
            } else {
              const err = await res.json();
              if (err?.error && !err.error.includes("Route")) {
                throw new Error(err.error);
              }
            }
          } catch (expressErr: any) {
            if (expressErr?.message && !expressErr.message.includes("fetch failed") && !expressErr.message.includes("ECONNREFUSED")) {
              throw expressErr;
            }
          }
        }

        // 2. Direct MongoDB authentication (native on Vercel and unified local dev)
        const db = await connectDB();
        let user: any = null;

        // 2. Direct MongoDB fallback
        if (db) {
          try {
            user = await User.findOne({ email });
          } catch (e: any) {
            console.warn("MongoDB user lookup notice:", e?.message);
          }
        }

        // If found in MongoDB
        if (user) {
          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) {
            throw new Error("Incorrect password");
          }

          if (user.active === false) {
            throw new Error("Account has been deactivated. Please contact management.");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role, // "ADMIN" | "EMPLOYEE"
          };
        }

        // 2. Check Persistent Database Store
        const dbUser = findDbUserByEmail(email);
        if (dbUser) {
          const isMatch = await bcrypt.compare(credentials.password, dbUser.password);
          if (!isMatch) {
            throw new Error("Incorrect password");
          }

          if (dbUser.active === false) {
            throw new Error("Account has been deactivated. Please contact management.");
          }

          return {
            id: dbUser._id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
          };
        }

        throw new Error("No active user registered with this email address");
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
