import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

const bitcount = localFont({
  src: '../../public/fonts/BitcountGridDouble-Variable.ttf',
  variable: '--font-bitcount',
  display: 'swap',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'AI Token Tracker — HEADLESSENGINEER',
  description: 'Track token usage across all AI coding tools — Claude, Codex, Cursor, Windsurf, Copilot, Kiro and more.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${bitcount.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
