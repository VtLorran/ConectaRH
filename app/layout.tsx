import type { Metadata } from "next";
import { Inter, Geist, Poppins } from "next/font/google"; // Agrupado os imports em uma linha só
import "./globals.css";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-poppins', 
});

const geist = Geist({ 
  subsets: ["latin"], 
  variable: "--font-geist" 
});

const inter = Inter({ 
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  title: "ConectaRH",
  description: "Sistema moderno para gestão de recursos humanos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`h-full ${poppins.variable} ${geist.variable}`}>
      <body
        className={`
          ${inter.className} 
          min-h-screen bg-[#EDEDED] text-slate-900 antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}