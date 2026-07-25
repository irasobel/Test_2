import { describe, expect, it } from "vitest";
import {
  isValidIsraeliId,
  normalizeIsraeliId,
  startExamSchema,
} from "./validation";

describe("isValidIsraeliId", () => {
  it("מקבל מספרים תקינים עם ספרת ביקורת נכונה", () => {
    // מספרים סינתטיים שספרת הביקורת שלהם מחושבת נכון
    expect(isValidIsraeliId("000000018")).toBe(true);
    expect(isValidIsraeliId("123456782")).toBe(true);
  });

  it("דוחה ספרת ביקורת שגויה", () => {
    expect(isValidIsraeliId("123456789")).toBe(false);
    expect(isValidIsraeliId("000000019")).toBe(false);
  });

  it("מרפד מספרים שנכתבו בלי אפסים מובילים", () => {
    expect(isValidIsraeliId("00000018")).toBe(true);
    expect(normalizeIsraeliId("00000018")).toBe("000000018");
  });

  it("דוחה קלט שאינו ספרות או באורך חריג", () => {
    expect(isValidIsraeliId("")).toBe(false);
    expect(isValidIsraeliId("abcdefghi")).toBe(false);
    // ארוך מדי משמונה-תשע ספרות, וקצר מכדי להיות תעודת זהות אמיתית
    expect(isValidIsraeliId("1234567890")).toBe(false);
    expect(isValidIsraeliId("18")).toBe(false);
    expect(isValidIsraeliId("12.456782")).toBe(false);
  });
});

describe("startExamSchema", () => {
  const valid = {
    nationalId: "123456782",
    firstName: "ישראל",
    lastName: "ישראלי",
    email: "",
  };

  it("מקבל קלט תקין", () => {
    expect(startExamSchema.safeParse(valid).success).toBe(true);
  });

  it("דוחה תעודת זהות עם ספרת ביקורת שגויה", () => {
    const result = startExamSchema.safeParse({
      ...valid,
      nationalId: "123456789",
    });
    expect(result.success).toBe(false);
  });

  it("דוחה שם פרטי קצר מדי", () => {
    expect(
      startExamSchema.safeParse({ ...valid, firstName: "א" }).success,
    ).toBe(false);
  });

  it("מאפשר דוא״ל ריק אך דוחה כתובת לא תקינה", () => {
    expect(startExamSchema.safeParse({ ...valid, email: "" }).success).toBe(
      true,
    );
    expect(
      startExamSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });
});
