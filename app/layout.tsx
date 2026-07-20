import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book a Cleaning | Reliance General Cleaning Services",
  description: "Book your cleaning appointment online in under a minute.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}
