import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "דוא״ל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const admin = await prisma.adminUser.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        // משווים תמיד מול hash כלשהו כדי שזמן התגובה לא יסגיר
        // האם המשתמש קיים במערכת.
        const hash =
          admin?.passwordHash ??
          "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
        const valid = await bcrypt.compare(parsed.data.password, hash);

        if (!admin || !valid) {
          return null;
        }

        return { id: admin.id, name: admin.name, email: admin.email };
      },
    }),
  ],
});
