/** BOM של UTF-8. בלעדיו Excel בעברית פותח את הקובץ כג׳יבריש. */
export const UTF8_BOM = "﻿";

/**
 * מצטט שדה בודד לפי RFC 4180: מירכאות כפולות מוכפלות, ושדה
 * המכיל פסיק, מירכאות או שבירת שורה עטוף במירכאות.
 *
 * בנוסף מנוטרל כאן CSV injection — שדה הפותח ב-=, +, - או @
 * מקבל גרש מוביל כדי ש-Excel לא יפרש אותו כנוסחה.
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

/** בונה מסמך CSV שלם, כולל BOM ושורות מופרדות ב-CRLF. */
export function buildCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ];
  return UTF8_BOM + lines.join("\r\n") + "\r\n";
}
