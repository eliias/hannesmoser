import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import LabShell from '@/components/LabShell'
import '@fontsource-variable/schibsted-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'lab.hannesmoser.at',
  description: 'Experiments by Hannes Moser',
}

// LabShell holds the mark rail and the timeline. It belongs here rather than
// in a page so it stays mounted while routes swap underneath it, which is
// what keeps the timeline's animation loop alive across a navigation.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LabShell>{children}</LabShell>
      </body>
    </html>
  )
}
