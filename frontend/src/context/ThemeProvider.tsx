"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

interface ThemeProviderProps extends React.PropsWithChildren {}

function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }

