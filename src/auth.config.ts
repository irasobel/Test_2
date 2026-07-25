import type { NextAuthConfig } from "next-auth";

/**
 * תצורה נטולת תלויות Node — נטענת גם ב-proxy (Edge).
 * ספקי ההתחברות עצמם מתווספים ב-src/auth.ts, שם מותר להשתמש ב-Prisma וב-bcrypt.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isLoginPage = nextUrl.pathname === "/admin/login";

      if (isLoginPage) {
        // מרצה מחובר שמגיע לדף ההתחברות מנותב לדשבורד.
        return isLoggedIn
          ? Response.redirect(new URL("/admin", nextUrl))
          : true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
