import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PaintTracker",
  description: "Track miniature painting progress by army, squad, and mini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
