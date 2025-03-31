import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google";
// Use the theme provider based on next-themes
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster"; // Import the Toaster
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Subtitle Generator",
  description: "AI-Powered Subtitle Generation Platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      {/* Ensure enableSystem is true if you want system preference detection */}
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster /> {/* Add the Toaster component here */}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
