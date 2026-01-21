import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const fontSans = Outfit({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Billing Citrux',
  description: 'Pro GST Billing Software',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(fontSans.className, "min-h-screen bg-background antialiased font-sans")}>
        {children}
      </body>
    </html>
  )
}
