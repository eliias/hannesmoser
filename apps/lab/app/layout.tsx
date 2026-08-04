import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@fontsource-variable/schibsted-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'lab.hannesmoser.at',
  description: 'Experiments by Hannes Moser',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
