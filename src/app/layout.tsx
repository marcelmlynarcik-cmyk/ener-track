import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { BottomNavbar } from '@/components/bottom-navbar'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'EnerTrack',
  description: 'Aplikácia na sledovanie spotreby energie v domácnosti',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="pb-16 md:pb-0">{children}</div>
          <BottomNavbar />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
