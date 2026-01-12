import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book an Appointment | Pecase',
  description: 'Book your salon appointment online with Pecase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
