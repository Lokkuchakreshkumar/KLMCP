import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

export const metadata = {
  title: "KLMCP",
  description: "Hosted MCP for KL University timetable, attendance, internals, and LMS dues.",
  icons: {
    icon: "/logo/image.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="page-container">
        {children}
      </body>
    </html>
  );
}
