import type { Metadata, Viewport } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'KEVI', template: '%s — KEVI' },
  description: 'Sales behaviour intelligence. Understand what your top performers actually do.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1e5e3f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
