import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "Pedestrian Counting App",
  description: "An app for counting pedestrians in videos",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            DOT Counting App
          </Link>
          <nav>
            <ul className="flex space-x-4">
              <Link href="/counter" className="hover:underline">
                Curb cut
              </Link>

            </ul>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
