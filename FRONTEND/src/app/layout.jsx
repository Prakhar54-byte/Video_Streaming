import { Nunito_Sans } from "next/font/google"
import "./globals.css"

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito-sans",
})

export const metadata = {
  title: "Login System",
  description: "Modern login system built with Next.js",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.variable} font-sans`}>{children}</body>
    </html>
  )
}

