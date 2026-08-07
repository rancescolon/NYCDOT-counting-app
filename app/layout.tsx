// app/layout.tsx

import type React from "react"
import type { Metadata } from "next"
import Navbar from "@/components/Navbar"
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
        <Navbar />
        {children}
        </body>
        </html>
    )
}