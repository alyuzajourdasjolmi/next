import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./style.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Penambahan Meta Tag Verifikasi Google di sini
export const metadata: Metadata = {
  title: "Hijrah Toko - Frozen Food & ATK Lengkap",
  description: "Hijrah Toko menyediakan frozen food berkualitas dan alat tulis kantor lengkap. Solusi dapur dan meja kerja dalam satu pintu.",
  manifest: "/manifest.json",
  themeColor: "#4ADE80",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hijrah Toko",
  },
  verification: {
    google: "DiDsLBn93uY2TjOmlRwh5sWJ9Ip6VU3aDt6S3m50NfE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}