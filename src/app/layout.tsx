import type { Metadata } from "next";
import { Rajdhani, Orbitron } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CS2 Team Picker - 5v5 Draft",
  description: "Interaktivní losování hráčů do CS2 týmů přes kolo štěstí",
  openGraph: {
    title: "CS2 Team Picker",
    description: "Vylosuj 5v5 týmy pro CS2 přes kolo štěstí!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${rajdhani.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-gray-100 font-rajdhani">
        {children}
      </body>
    </html>
  );
}
