import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next 16 מחליף את middleware.ts ב-proxy.ts. הקובץ רץ ב-Edge,
// ולכן הוא נטען מתצורה שאינה נוגעת ב-Prisma או ב-bcrypt.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*"],
};
