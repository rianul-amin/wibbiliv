import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google"; 
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: "Wibbiliv",
  description: "A next-generation blockchain wallet crafted for speed, security, and true ownership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={notoSans.className}>
        {children}
      </body>
    </html>
  );
}
