import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "מערכת מבחנים מקוונת",
    template: "%s | מערכת מבחנים מקוונת",
  },
  description: "מבחן אמריקאי מקוון עם ניקוד אוטומטי ודשבורד למרצה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="bg-slate-50 text-slate-900 min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg focus:ring-2 focus:ring-sky-700"
        >
          דילוג לתוכן הראשי
        </a>
        {children}
      </body>
    </html>
  );
}
