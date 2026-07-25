import { execFileSync } from "node:child_process";

/**
 * מריץ את ה-seed מחדש לפני כל ריצת e2e.
 * מחיקת המבחן מוחקת בשרשור את ההגשות, כך שבדיקות כמו "הגשה כפולה"
 * מתחילות תמיד ממצב נקי וניתן להריץ את החבילה שוב ושוב.
 */
export default function globalSetup() {
  execFileSync("npx", ["tsx", "prisma/seed.ts"], { stdio: "inherit" });
}
