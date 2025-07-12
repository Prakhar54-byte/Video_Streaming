import React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "../context/ThemeProvider";
import Toaster from "../components/ui/Toaster";
import "../styles/global.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Video Sharing Platform",
  description: "Share and discover videos from creators around the world",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
