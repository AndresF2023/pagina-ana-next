import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ejercicios de Tenis",
  description: "Biblioteca de ejercicios de tenis con videos y notas personalizadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
