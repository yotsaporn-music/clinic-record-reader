import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Mega Clinic — บันทึกแพทย์',
  description: 'ระบบอ่านใบบันทึกทางการแพทย์',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}