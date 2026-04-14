import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tenis del 9",
  description: "Biblioteca de ejercicios de tenis con videos y notas personalizadas.",
  icons: { icon: "/club.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full bg-sky-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
