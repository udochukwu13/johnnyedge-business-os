import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JohnnyEdge AI Business OS",
  description: "The intelligent operating system for modern businesses."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}