import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuditLens — UX Evaluation Engine",
  description: "Senior-grade UX audits powered by AI. Upload screenshots, get actionable findings with metrics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
