import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // הבדיקות חולקות בסיס נתונים אחד ותלויות בסדר (הגשה ואז הגשה חוזרת),
  // ולכן הן רצות בזו אחר זו.
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // בסביבות שבהן Chromium כבר מותקן (למשל CI מוכן מראש), מצביעים
        // עליו ישירות במקום להוריד גרסה נוספת.
        launchOptions: process.env.CHROMIUM_PATH
          ? { executablePath: process.env.CHROMIUM_PATH }
          : {},
      },
    },
  ],
});
