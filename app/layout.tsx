import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "DOT Counting App",
  description: "An app for counting in videos",
  generator: "Rances Colon",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <header className="bg-black text-white p-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            DOT Counting App
          </Link>
          <nav>
            <ul className="flex items-center gap-6">
              <li>
                <Link href="/counter" className="hover:text-gray-300 transition-colors">
                  Curb Cut
                </Link>
              </li>

              <li>
                <Link href="/speedStudy" className="hover:text-gray-300 transition-colors">
                  Speed Study
                </Link>
              </li>
            </ul>

          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
