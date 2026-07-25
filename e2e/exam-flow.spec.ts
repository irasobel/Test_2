import { expect, test } from "@playwright/test";

const EXAM_SLUG = "longevity-final-exam-2026";

/** תעודות זהות סינתטיות עם ספרת ביקורת תקינה. */
const VALID_ID = "123456782";
const SECOND_ID = "000000018";

test.describe("מסלול הנבחן", () => {
  test("דף הבית מוגש בעברית ובכיוון ימין-לשמאל", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(
      page.getByRole("heading", { name: "מערכת מבחנים מקוונת" }),
    ).toBeVisible();
  });

  test("דף המבחן מציג את פרטי המועד", async ({ page }) => {
    await page.goto(`/exam/${EXAM_SLUG}`);
    await expect(
      page.getByRole("heading", { name: /מבחן מסכם בקורס/ }),
    ).toBeVisible();
    await expect(page.getByText("מועד א׳")).toBeVisible();
  });

  test("תעודת זהות לא תקינה נחסמת עם הודעת שגיאה נגישה", async ({ page }) => {
    await page.goto(`/exam/${EXAM_SLUG}`);
    await page.getByLabel("תעודת זהות").fill("123456789");
    await page.getByLabel("שם פרטי").fill("ישראל");
    await page.getByLabel("שם משפחה").fill("ישראלי");
    await page.getByRole("button", { name: "התחלת המבחן" }).click();

    const error = page.locator("p[role=\"alert\"]");
    await expect(error).toContainText("תעודת הזהות");
    await expect(page).toHaveURL(new RegExp(`/exam/${EXAM_SLUG}$`));
  });

  test("מסלול מלא: התחלה, מענה, הגשה וניקוד בשרת", async ({ page }) => {
    await page.goto(`/exam/${EXAM_SLUG}`);
    await page.getByLabel("תעודת זהות").fill(VALID_ID);
    await page.getByLabel("שם פרטי").fill("ישראל");
    await page.getByLabel("שם משפחה").fill("ישראלי");
    await page.getByRole("button", { name: "התחלת המבחן" }).click();

    await expect(page).toHaveURL(/\/exam\/.+\/[a-z0-9]+$/);
    await expect(page.getByText("הזמן שנותר")).toBeVisible();

    const questions = page.locator("ol > li");
    await expect(questions).toHaveCount(31);

    // עונים על השאלה הראשונה ומוודאים שהשמירה האוטומטית מדווחת.
    await questions.first().getByRole("radio").first().check();
    await expect(page.getByText(/נשמר/)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "הגשת המבחן" }).click();

    await expect(page).toHaveURL(/\/result$/);
    await expect(page.getByRole("heading", { name: "תוצאת המבחן" })).toBeVisible();
    await expect(page.getByText("ניקוד")).toBeVisible();
  });

  test("הגשה חוזרת נחסמת כשהמבחן מוגדר לניסיון יחיד", async ({ page }) => {
    await page.goto(`/exam/${EXAM_SLUG}`);
    await page.getByLabel("תעודת זהות").fill(VALID_ID);
    await page.getByLabel("שם פרטי").fill("ישראל");
    await page.getByLabel("שם משפחה").fill("ישראלי");
    await page.getByRole("button", { name: "התחלת המבחן" }).click();

    await expect(page.locator("p[role=\"alert\"]")).toContainText("כבר הגשת");
  });

  test("התשובות הנשמרות חוזרות אחרי רענון הדף", async ({ page }) => {
    await page.goto(`/exam/${EXAM_SLUG}`);
    await page.getByLabel("תעודת זהות").fill(SECOND_ID);
    await page.getByLabel("שם פרטי").fill("דנה");
    await page.getByLabel("שם משפחה").fill("כהן");
    await page.getByRole("button", { name: "התחלת המבחן" }).click();

    const firstQuestion = page.locator("ol > li").first();
    const secondChoice = firstQuestion.getByRole("radio").nth(1);
    await secondChoice.check();
    await expect(page.getByText(/נשמר/)).toBeVisible({ timeout: 10_000 });

    await page.reload();

    await expect(
      page.locator("ol > li").first().getByRole("radio").nth(1),
    ).toBeChecked();
  });
});

test.describe("אזור המרצה", () => {
  test("דשבורד המרצה חסום למי שאינו מחובר", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("ייצוא ה-CSV חסום למי שאינו מחובר", async ({ request }) => {
    const response = await request.get("/admin/exams/does-not-exist/export", {
      maxRedirects: 0,
    });
    expect(response.status()).not.toBe(200);
  });

  test("התחברות שגויה אינה חושפת אם המשתמש קיים", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("דוא״ל").fill("admin@example.com");
    await page.getByLabel("סיסמה").fill("wrong-password-entirely");
    await page.getByRole("button", { name: "התחברות" }).click();

    await expect(page.locator("p[role=\"alert\"]")).toContainText("פרטי ההתחברות שגויים");
  });

  test("מרצה מחובר רואה תוצאות ומייצא CSV עם BOM", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("דוא״ל").fill("admin@example.com");
    await page.getByLabel("סיסמה").fill("change-me-please");
    await page.getByRole("button", { name: "התחברות" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "דשבורד מרצה" })).toBeVisible();

    await page.getByRole("link", { name: "צפייה בתוצאות" }).first().click();
    await expect(page.getByRole("table")).toBeVisible();

    const exportLink = page.getByRole("link", { name: "ייצוא ל-CSV" });
    const href = await exportLink.getAttribute("href");
    const response = await page.request.get(href!);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");

    const body = await response.body();
    // שלושת הבתים הראשונים חייבים להיות ה-BOM, אחרת Excel ישבור את העברית.
    expect([body[0], body[1], body[2]]).toEqual([0xef, 0xbb, 0xbf]);
    expect(body.toString("utf8")).toContain("תעודת זהות");
  });
});
