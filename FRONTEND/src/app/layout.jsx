import React from "react";
import { Inter } from "next/font/google";
import "../app/globals.css";

const inter = Inter({ subsets: ["latin"] });

function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Login System</title>
        <meta
          name="description"
          content="Modern login system built with Next.js"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

export default RootLayout;
