import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drift",
  description: "A five-letter lockpick word game with alphabetical proximity clues."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
