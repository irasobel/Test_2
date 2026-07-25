import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const EXAM_SLUG = "longevity-final-exam-2026";
const A11Y_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function scan(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page }).withTags(A11Y_TAGS).analyze();
}

test.describe("נגישות", () => {
  test("דף הבית ללא הפרות", async ({ page }) => {
    await page.goto("/");
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("דף הרשמה למבחן ללא הפרות", async ({ page }) => {
    await page.goto(`/exam/${EXAM_SLUG}`);
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("דף הרשמה עם שגיאות ולידציה ללא הפרות", async ({ page }) => {
    await page.goto(`/exam/${EXAM_SLUG}`);
    await page.getByLabel("תעודת זהות").fill("123456789");
    await page.getByLabel("שם פרטי").fill("א");
    await page.getByLabel("שם משפחה").fill("ב");
    await page.getByRole("button", { name: "התחלת המבחן" }).click();
    await page.getByRole("alert").first().waitFor();

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("דף המבחן עצמו ללא הפרות", async ({ page }) => {
    await page.goto(`/exam/${EXAM_SLUG}`);
    await page.getByLabel("תעודת זהות").fill("039999990");
    await page.getByLabel("שם פרטי").fill("נגישות");
    await page.getByLabel("שם משפחה").fill("בדיקה");
    await page.getByRole("button", { name: "התחלת המבחן" }).click();
    await page.getByText("הזמן שנותר").waitFor();

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("דף התחברות המרצה ללא הפרות", async ({ page }) => {
    await page.goto("/admin/login");
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test("דשבורד וטבלת התוצאות ללא הפרות", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("דוא״ל").fill("admin@example.com");
    await page.getByLabel("סיסמה").fill("change-me-please");
    await page.getByRole("button", { name: "התחברות" }).click();
    await page.getByRole("heading", { name: "דשבורד מרצה" }).waitFor();

    expect((await scan(page)).violations).toEqual([]);

    await page.getByRole("link", { name: "צפייה בתוצאות" }).first().click();
    await page.getByRole("table").waitFor();

    expect((await scan(page)).violations).toEqual([]);
  });
});
