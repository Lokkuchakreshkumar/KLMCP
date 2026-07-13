import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const lastik = localFont({
  src: "../../public/fonts/Lastik-Regular.otf",
  variable: "--font-lastik",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
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
      className={`${lastik.variable} ${jetbrainsMono.variable}`}
    >
      <body className="page-container">
        <div className="main-content-panel">
          {children}
        </div>
      </body>
    </html>
  );
}
