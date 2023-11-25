import { Inter } from 'next/font/google'
import './globals.css'
import { SettingsProvider } from './settings/SettingsContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'VoiceGPT',
  description: '',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <SettingsProvider>
        <body className={inter.className} suppressHydrationWarning={true}>{children}</body>
      </SettingsProvider>
    </html>
  )
}
