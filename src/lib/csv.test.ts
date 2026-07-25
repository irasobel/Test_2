import { describe, expect, it } from "vitest";
import { buildCsv, escapeCsvField, UTF8_BOM } from "./csv";

describe("escapeCsvField", () => {
  it("משאיר טקסט פשוט כמות שהוא", () => {
    expect(escapeCsvField("ישראל")).toBe("ישראל");
    expect(escapeCsvField(42)).toBe("42");
  });

  it("ממיר null ו-undefined למחרוזת ריקה", () => {
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("עוטף שדה שמכיל פסיק", () => {
    expect(escapeCsvField("ישראלי, ישראל")).toBe('"ישראלי, ישראל"');
  });

  it("מכפיל מירכאות בתוך שדה", () => {
    expect(escapeCsvField('הוא אמר "שלום"')).toBe('"הוא אמר ""שלום"""');
  });

  it("עוטף שדה שמכיל שבירת שורה", () => {
    expect(escapeCsvField("שורה\nשנייה")).toBe('"שורה\nשנייה"');
  });

  it("מנטרל נוסחאות Excel", () => {
    expect(escapeCsvField("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(escapeCsvField("+1")).toBe("'+1");
    expect(escapeCsvField("-1")).toBe("'-1");
    expect(escapeCsvField("@name")).toBe("'@name");
  });

  it("מנטרל נוסחה ועוטף כשיש גם פסיק", () => {
    expect(escapeCsvField("=A1,B2")).toBe(`"'=A1,B2"`);
  });
});

describe("buildCsv", () => {
  it("מוסיף BOM בתחילת הקובץ", () => {
    const csv = buildCsv(["שם"], [["ישראל"]]);
    expect(csv.startsWith(UTF8_BOM)).toBe(true);
  });

  it("מפריד שורות ב-CRLF ומסיים בשורה חדשה", () => {
    const csv = buildCsv(["א", "ב"], [
      [1, 2],
      [3, 4],
    ]);
    expect(csv).toBe(`${UTF8_BOM}א,ב\r\n1,2\r\n3,4\r\n`);
  });

  it("מטפל בטבלה ללא שורות", () => {
    expect(buildCsv(["א", "ב"], [])).toBe(`${UTF8_BOM}א,ב\r\n`);
  });
});
