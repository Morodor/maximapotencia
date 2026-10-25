import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Máxima Potencia | Periodización Élite",
  description: "Motor algorítmico de periodización deportiva impulsado por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-lg">M</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                Máxima<span className="text-primary">Potencia</span>
              </h1>
            </div>
            <nav>
              {/* Future: Profile / Logout */}
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
