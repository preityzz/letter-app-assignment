import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";


const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Letter App - Modern Document Creation",
  description:
    "Create, manage, and share professional letters with Google Drive integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
